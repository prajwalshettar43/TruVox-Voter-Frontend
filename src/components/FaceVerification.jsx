import React, { useState, useRef } from 'react';
import { Camera, Upload, User, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const FaceVerification = ({ epicId, setEpicId }) => {
  // --- State & Logic from Original Code ---
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const navigate = useNavigate();

  // Start camera
  const startCamera = async () => {
    try {
      setError('');
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported in this browser');
      }

      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setShowCamera(true);
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(e => {
            console.error('Error playing video:', e);
            setError('Failed to start video playback');
          });
        }
      }, 100);
      
    } catch (err) {
      console.error('Camera access error:', err);
      let errorMessage = 'Failed to access camera: ';
      if (err.name === 'NotAllowedError') errorMessage += 'Permission denied.';
      else if (err.name === 'NotFoundError') errorMessage += 'No camera found.';
      else errorMessage += err.message;
      
      setError(errorMessage);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  // Capture photo
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        setSelectedImage(blob);
        setPreviewUrl(canvas.toDataURL());
        stopCamera();
      }, 'image/jpeg', 0.8);
    }
  };

  // Handle file upload
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Reset form
  const resetForm = () => {
    setSelectedImage(null);
    setPreviewUrl('');
    setVerificationResult(null);
    setError('');
    setUserId('');
    stopCamera();
  };

  // --- Logic: Verify Face (Your Original Logic) ---
  const verifyFace = async () => {
    if (!userId.trim()) {
      setError('Please enter a User ID');
      return;
    }
    if (!selectedImage) {
      setError('Please select or capture an image');
      return;
    }

    setIsVerifying(true);
    setError('');
    setVerificationResult(null);

    try {
      const formData = new FormData();
      formData.append('epic', userId);
      formData.append('photo', selectedImage, 'verification_image.jpg');

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/verify`, {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();

      if (response.ok) {
        setVerificationResult(result);
        
        if(result.match){
          // Success
          setEpicId(userId);
          navigate("/vote");
          toast.success("Verification success please cast your vote");
        } else {
          // --- FAILURE: Log Security Incident ---
          toast.error("Verification failed");

          const securityMessage = `SECURITY ALERT: An unauthorized person attempted to log in using EPIC ID '${userId}' at Booth 0710. Identity verification failed.`;

          // Send to backend
          fetch(`${import.meta.env.VITE_API_BASE_URL}/log-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: securityMessage })
          }).catch(err => console.error("Failed to log incident", err));
        }

      } else {
        // Handle server errors
        setError(result.detail || 'Verification failed');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    // --- UI: High Quality Styling (Dark Mode, Gradients) ---
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-5xl mx-auto relative z-10 mt-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            TruVoxx
          </h1>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mt-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
            <span className="text-gray-300 font-mono text-sm tracking-wider">
              BOOTH ID: <span className="text-white font-bold">0710</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Sidebar - Verification Guide (Kept for UI Balance) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
              <h3 className="text-white font-semibold mb-4">Verification Guide</h3>
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex items-start space-x-2">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-xs mt-0.5">1</div>
                  <span>Enter your registered User ID (EPIC)</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-xs mt-0.5">2</div>
                  <span>Capture or upload a clear face photo</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-xs mt-0.5">3</div>
                  <span>System verifies against Blockchain records</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Verification Form */}
          <div className="lg:col-span-2">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-6 md:p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Face Verification</h2>
                <p className="text-gray-400">Verify your identity using advanced facial recognition</p>
              </div>

              {/* User ID Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  <User className="inline w-4 h-4 mr-2" />
                  User ID
                </label>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter your EPIC ID"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
                  disabled={isVerifying}
                />
              </div>

              {/* Image Capture/Upload Section */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Verification Image
                </label>
                
                {/* Camera View */}
                {showCamera && (
                  <div className="mb-4">
                    <div className="relative max-w-md mx-auto">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full rounded-xl border-2 border-white/20"
                        style={{ transform: 'scaleX(-1)' }}
                        onLoadedMetadata={() => console.log('Video metadata loaded')}
                        onError={(e) => {
                          console.error('Video error:', e);
                          setError('Video playback error');
                        }}
                      />
                      <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-medium">
                        LIVE
                      </div>
                    </div>
                    <div className="flex gap-3 mt-4 justify-center">
                      <button
                        onClick={capturePhoto}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                      >
                        📸 Capture Photo
                      </button>
                      <button
                        onClick={stopCamera}
                        className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Image Preview */}
                {previewUrl && !showCamera && (
                  <div className="mb-4 text-center">
                    <div className="relative inline-block">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-w-xs rounded-xl border-2 border-white/20"
                      />
                      <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-medium">
                        READY
                      </div>
                    </div>
                  </div>
                )}

                {/* Capture/Upload Buttons */}
                {!showCamera && !previewUrl && (
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={startCamera}
                      className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-medium"
                      disabled={isVerifying}
                    >
                      <Camera className="w-4 h-4" />
                      Use Camera
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium"
                      disabled={isVerifying}
                    >
                      <Upload className="w-4 h-4" />
                      Upload Image
                    </button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Error Display */}
              {error && (
                <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
                  <div className="flex items-center text-red-300">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    <span className="font-medium">{error}</span>
                  </div>
                </div>
              )}

              {/* Verification Result */}
              {verificationResult && (
                <div className={`mb-6 p-5 rounded-xl border ${
                  verificationResult.match 
                    ? 'bg-green-500/20 border-green-500/30' 
                    : 'bg-red-500/20 border-red-500/30'
                }`}>
                  <div className={`flex items-center mb-3 ${
                    verificationResult.match ? 'text-green-300' : 'text-red-300'
                  }`}>
                    {verificationResult.match ? (
                      <CheckCircle className="w-6 h-6 mr-2" />
                    ) : (
                      <XCircle className="w-6 h-6 mr-2" />
                    )}
                    <span className="font-bold text-lg">
                      {verificationResult.match ? 'Verification Successful' : 'Verification Failed'}
                    </span>
                  </div>
                  
                  <div className="text-white/90 space-y-2">
                    <div>
                      <span className="font-medium">Confidence Score: </span>
                      <span className={verificationResult.match_score >= 0.7 ? 'text-green-300' : 'text-red-300'}>
                        {(verificationResult.match_score * 100).toFixed(1)}%
                      </span>
                    </div>
                    {verificationResult.is_live !== undefined && (
                      <div>
                        <span className="font-medium">Liveness Check: </span>
                        <span className={verificationResult.is_live ? 'text-green-300' : 'text-red-300'}>
                          {verificationResult.is_live ? 'Passed' : 'Failed'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={verifyFace}
                  disabled={isVerifying || !userId.trim() || !selectedImage}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all font-semibold"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Verify Face
                    </>
                  )}
                </button>
                
                <button
                  onClick={resetForm}
                  className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all font-medium"
                  disabled={isVerifying}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default FaceVerification;