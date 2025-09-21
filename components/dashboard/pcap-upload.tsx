"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Upload, File, CheckCircle, AlertCircle, X, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useDropzone } from "react-dropzone"

interface UploadResult {
  success: boolean
  filename: string
  file_size: number
  results: {
    total_packets: number
    http_packets: number
    extracted_urls_count: number
    processing_time: number
  }
}

export function PCAPUpload() {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return

      // Validate file type
      const allowedTypes = [".pcap", ".pcapng", ".cap"]
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."))

      if (!allowedTypes.includes(fileExtension)) {
        setError("Invalid file type. Only .pcap, .pcapng, and .cap files are allowed.")
        return
      }

      // Validate file size (100MB max)
      const maxSize = 100 * 1024 * 1024
      if (file.size > maxSize) {
        setError("File too large. Maximum size is 100MB.")
        return
      }

      setUploading(true)
      setUploadProgress(0)
      setError(null)
      setUploadResult(null)

      try {
        const formData = new FormData()
        formData.append("file", file)

        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => Math.min(prev + 10, 90))
        }, 200)

        const response = await fetch("/api/upload/pcap", {
          method: "POST",
          body: formData,
        })

        clearInterval(progressInterval)
        setUploadProgress(100)

        const result = await response.json()

        if (response.ok) {
          setUploadResult(result)
          toast({
            title: "Upload Successful",
            description: `Processed ${result.results.extracted_urls_count} URLs from ${result.results.total_packets} packets`,
          })
        } else {
          throw new Error(result.error || "Upload failed")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed")
        toast({
          title: "Upload Failed",
          description: err instanceof Error ? err.message : "Unknown error occurred",
          variant: "destructive",
        })
      } finally {
        setUploading(false)
        setTimeout(() => setUploadProgress(0), 2000)
      }
    },
    [toast],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/octet-stream": [".pcap", ".pcapng", ".cap"],
    },
    maxFiles: 1,
    disabled: uploading,
  })

  const resetUpload = () => {
    setUploadResult(null)
    setError(null)
    setUploadProgress(0)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          PCAP File Analysis
        </CardTitle>
        <CardDescription>Upload packet capture files to extract and analyze HTTP URLs</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!uploadResult && !error && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
            } ${uploading ? "pointer-events-none opacity-50" : ""}`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center space-y-3">
              <File className="h-12 w-12 text-muted-foreground" />
              <div>
                <p className="text-lg font-medium">{isDragActive ? "Drop the file here" : "Drop PCAP file here"}</p>
                <p className="text-sm text-muted-foreground">
                  or click to browse (.pcap, .pcapng, .cap files, max 100MB)
                </p>
              </div>
              {!uploading && (
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
              )}
            </div>
          </div>
        )}

        {uploading && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Uploading and processing...</span>
              <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}

        {uploadResult && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-medium">Upload Successful</span>
              </div>
              <Button variant="ghost" size="sm" onClick={resetUpload}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{uploadResult.filename}</span>
                </div>
                <Badge variant="outline">{formatFileSize(uploadResult.file_size)}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 border rounded-lg text-center">
                  <div className="text-2xl font-bold text-primary">
                    {uploadResult.results.total_packets.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Packets</div>
                </div>

                <div className="p-3 border rounded-lg text-center">
                  <div className="text-2xl font-bold text-chart-2">
                    {uploadResult.results.http_packets.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">HTTP Packets</div>
                </div>

                <div className="p-3 border rounded-lg text-center">
                  <div className="text-2xl font-bold text-chart-1">
                    {uploadResult.results.extracted_urls_count.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">URLs Extracted</div>
                </div>

                <div className="p-3 border rounded-lg text-center">
                  <div className="text-2xl font-bold text-muted-foreground">
                    {uploadResult.results.processing_time.toFixed(1)}s
                  </div>
                  <div className="text-xs text-muted-foreground">Processing Time</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <span className="font-medium text-destructive">Upload Failed</span>
              </div>
              <Button variant="ghost" size="sm" onClick={resetUpload}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={resetUpload}>
              Try Again
            </Button>
          </div>
        )}

        {/* Info Section */}
        <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
          <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p>Upload PCAP files to extract HTTP URLs and analyze them for potential cyber attacks.</p>
            <p className="mt-1">Supported formats: .pcap, .pcapng, .cap (max 100MB)</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
