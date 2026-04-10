import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

const UploadZone = ({ onUpload }) => {
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0]
    if (file) {
      const formData = new FormData()
      formData.append('report', file)
      onUpload(formData)
    }
  }, [onUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1
  })

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
        isDragActive 
          ? 'border-dhara-green bg-dhara-green/10' 
          : 'border-white/30 hover:border-dhara-green/70 hover:bg-dhara-green/5'
      }`}
    >
      <input {...getInputProps()} />
      <div className="text-4xl mb-4">🗂️</div>
      <div className="text-white font-medium mb-2">Click to upload or drag & drop</div>
      <div className="text-xs opacity-60">PNG, JPG, PDF supported</div>
    </div>
  )
}

export default UploadZone
