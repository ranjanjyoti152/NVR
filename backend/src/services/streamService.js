const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs').promises;
const { spawn } = require('child_process');
const baseLogger = require('../utils/baseLogger');

class StreamService {
    constructor() {
        this.streams = new Map(); // Map of active streams: cameraId -> stream process
        this.recordings = new Map(); // Map of active recordings: cameraId -> recording process
        this.io = null; // Socket.IO instance
    }

    initialize(server, io) {
        this.io = io;
        baseLogger.info('Stream service initialized');
    }

    async startStream(camera) {
        if (this.streams.has(camera.id)) {
            throw new Error('Stream already active for this camera');
        }

        try {
            const isHttpStream = camera.streamUrl.startsWith('http');
            const ffmpegArgs = isHttpStream ? [
                '-re',  // Read input at native frame rate
                '-i', camera.streamUrl,
                '-f', 'image2pipe',
                '-vf', 'scale=800:600',
                '-pix_fmt', 'yuv420p',
                '-vcodec', 'mjpeg',
                '-q:v', '2',
                '-r', '15',
                '-'
            ] : [
                '-rtsp_transport', 'tcp',
                '-i', camera.streamUrl,
                '-f', 'image2pipe',
                '-vf', 'scale=800:600',
                '-pix_fmt', 'yuv420p',
                '-vcodec', 'mjpeg',
                '-q:v', '2',
                '-r', '15',
                '-'
            ];

            const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

            let frameBuffer = Buffer.alloc(0);
            let isJPEGStart = false;
            let isJPEGComplete = false;

            ffmpegProcess.stdout.on('data', (data) => {
                // Look for JPEG start marker (0xFF 0xD8)
                let startIndex = 0;
                while (startIndex < data.length - 1) {
                    if (data[startIndex] === 0xFF && data[startIndex + 1] === 0xD8) {
                        if (isJPEGStart) {
                            // We found a new JPEG start before completing the previous one
                            // Discard the incomplete frame
                            frameBuffer = Buffer.alloc(0);
                        }
                        isJPEGStart = true;
                        frameBuffer = Buffer.from(data.slice(startIndex));
                        break;
                    }
                    startIndex++;
                }

                if (!isJPEGStart) {
                    // If we haven't found a start marker, append to existing buffer
                    frameBuffer = Buffer.concat([frameBuffer, data]);
                }

                // Look for JPEG end marker (0xFF 0xD9)
                if (isJPEGStart) {
                    let endIndex = 0;
                    while (endIndex < data.length - 1) {
                        if (data[endIndex] === 0xFF && data[endIndex + 1] === 0xD9) {
                            isJPEGComplete = true;
                            frameBuffer = Buffer.concat([frameBuffer, data.slice(0, endIndex + 2)]);
                            break;
                        }
                        endIndex++;
                    }
                }

                // If we have a complete JPEG frame, emit it
                if (isJPEGComplete) {
                    try {
                        if (this.io) {
                            this.io.to(`camera_${camera.id}`).emit('stream', frameBuffer.toString('base64'));
                        }
                    } catch (error) {
                        baseLogger.error(`Error emitting frame for camera ${camera.id}:`, error);
                    }

                    // Reset for next frame
                    frameBuffer = Buffer.alloc(0);
                    isJPEGStart = false;
                    isJPEGComplete = false;
                }
            });

            ffmpegProcess.stderr.on('data', (data) => {
                baseLogger.debug(`FFmpeg stderr for camera ${camera.id}: ${data}`);
            });

            ffmpegProcess.on('error', (error) => {
                baseLogger.error(`FFmpeg error for camera ${camera.id}:`, error);
                this.handleStreamError(camera.id, error);
            });

            ffmpegProcess.on('exit', (code, signal) => {
                if (code !== 0) {
                    baseLogger.error(`FFmpeg error for camera ${camera.id}: ffmpeg exited with code ${code}: ${camera.streamUrl}: ${signal || 'unknown error'}`);
                    this.handleStreamError(camera.id, new Error(`ffmpeg exited with code ${code}: ${camera.streamUrl}: ${signal || 'unknown error'}`));
                }
            });

            this.streams.set(camera.id, ffmpegProcess);
            baseLogger.info(`Started stream for camera ${camera.id}`);
            return true;
        } catch (error) {
            baseLogger.error(`Failed to start stream for camera ${camera.id}:`, error);
            throw error;
        }
    }

    async stopStream(cameraId) {
        const stream = this.streams.get(cameraId);
        if (!stream) {
            return false;
        }

        try {
            stream.kill('SIGTERM');
            this.streams.delete(cameraId);
            baseLogger.info(`Stopped stream for camera ${cameraId}`);
            return true;
        } catch (error) {
            baseLogger.error(`Error stopping stream for camera ${cameraId}:`, error);
            throw error;
        }
    }

    async startRecording(cameraId, recordingId, outputPath) {
        if (this.recordings.has(cameraId)) {
            throw new Error('Recording already active for this camera');
        }

        try {
            const recordingProcess = spawn('ffmpeg', [
                '-i', this.streams.get(cameraId).streamUrl,
                '-c', 'copy',
                '-movflags', '+faststart',
                outputPath
            ]);

            this.recordings.set(cameraId, {
                process: recordingProcess,
                recordingId,
                outputPath
            });

            baseLogger.info(`Started recording for camera ${cameraId}`);
            return true;
        } catch (error) {
            baseLogger.error(`Failed to start recording for camera ${cameraId}:`, error);
            throw error;
        }
    }

    async stopRecording(cameraId) {
        const recording = this.recordings.get(cameraId);
        if (!recording) {
            return false;
        }

        try {
            recording.process.kill('SIGTERM');
            this.recordings.delete(cameraId);
            baseLogger.info(`Stopped recording for camera ${cameraId}`);
            return true;
        } catch (error) {
            baseLogger.error(`Error stopping recording for camera ${cameraId}:`, error);
            throw error;
        }
    }

    async getStreamStatus(cameraId) {
        const stream = this.streams.get(cameraId);
        const room = this.io?.sockets.adapter.rooms.get(`camera_${cameraId}`);
        return {
            active: !!stream,
            viewers: room?.size || 0
        };
    }

    handleStreamError(cameraId, error) {
        // Clean up stream
        this.streams.delete(cameraId);

        // Notify WebSocket clients
        if (this.io) {
            this.io.to(`camera_${cameraId}`).emit('stream_error', {
                type: 'error',
                message: 'Stream error occurred',
                error: error.message
            });
        }
    }
}

module.exports = new StreamService();
