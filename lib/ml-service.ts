// ML Service integration for Next.js backend
import { spawn } from "child_process"
import fs from "fs/promises"
import path from "path"

export interface MLPredictionResult {
  url: string
  predicted_attack_type: string
  confidence: number
  risk_level: string
  all_probabilities: Record<string, number>
  features: Record<string, number>
  model_used: string
  model_version: string
  processing_time_ms: number
  timestamp: string
  error?: string
}

export class MLService {
  private static instance: MLService
  private pythonPath: string
  private scriptPath: string
  private isInitialized = false

  private constructor() {
    this.pythonPath = process.env.PYTHON_PATH || "python3"
    this.scriptPath = path.join(process.cwd(), "scripts", "ml_inference.py")
  }

  public static getInstance(): MLService {
    if (!MLService.instance) {
      MLService.instance = new MLService()
    }
    return MLService.instance
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Check if models exist
      const modelsDir = path.join(process.cwd(), "models")
      const modelExists = await this.checkModelsExist(modelsDir)

      if (!modelExists) {
        console.log("ML models not found. Training models...")
        await this.trainModels()
      }

      this.isInitialized = true
      console.log("ML Service initialized successfully")
    } catch (error) {
      console.error("Failed to initialize ML Service:", error)
      throw error
    }
  }

  private async checkModelsExist(modelsDir: string): Promise<boolean> {
    try {
      const files = await fs.readdir(modelsDir)
      const hasEnsemble = files.some((f) => f.includes("ensemble_v"))
      const hasMetadata = files.some((f) => f.includes("metadata_v"))
      const hasScaler = files.some((f) => f.includes("scaler_v"))

      return hasEnsemble && hasMetadata && hasScaler
    } catch {
      return false
    }
  }

  private async trainModels(): Promise<void> {
    return new Promise((resolve, reject) => {
      const trainingScript = path.join(process.cwd(), "scripts", "ml_training.py")
      const process = spawn(this.pythonPath, [trainingScript])

      let output = ""
      let errorOutput = ""

      process.stdout.on("data", (data) => {
        output += data.toString()
        console.log(data.toString())
      })

      process.stderr.on("data", (data) => {
        errorOutput += data.toString()
        console.error(data.toString())
      })

      process.on("close", (code) => {
        if (code === 0) {
          console.log("Model training completed successfully")
          resolve()
        } else {
          reject(new Error(`Training failed with code ${code}: ${errorOutput}`))
        }
      })

      process.on("error", (error) => {
        reject(error)
      })
    })
  }

  async predict(url: string, modelType = "ensemble"): Promise<MLPredictionResult> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    return new Promise((resolve, reject) => {
      const process = spawn(this.pythonPath, [
        "-c",
        `
import sys
sys.path.append('${path.dirname(this.scriptPath)}')
from ml_inference import CyberAttackPredictor
import json

try:
    predictor = CyberAttackPredictor()
    result = predictor.predict('${url}', '${modelType}')
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({'error': str(e), 'url': '${url}'}))
        `,
      ])

      let output = ""
      let errorOutput = ""

      process.stdout.on("data", (data) => {
        output += data.toString()
      })

      process.stderr.on("data", (data) => {
        errorOutput += data.toString()
      })

      process.on("close", (code) => {
        try {
          const result = JSON.parse(output.trim())
          resolve(result)
        } catch (parseError) {
          reject(new Error(`Failed to parse ML output: ${parseError}, Output: ${output}, Error: ${errorOutput}`))
        }
      })

      process.on("error", (error) => {
        reject(error)
      })
    })
  }

  async batchPredict(urls: string[], modelType = "ensemble"): Promise<MLPredictionResult[]> {
    const predictions = await Promise.all(urls.map((url) => this.predict(url, modelType)))
    return predictions
  }

  async getModelInfo(): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    return new Promise((resolve, reject) => {
      const process = spawn(this.pythonPath, [
        "-c",
        `
import sys
sys.path.append('${path.dirname(this.scriptPath)}')
from ml_inference import CyberAttackPredictor
import json

try:
    predictor = CyberAttackPredictor()
    info = predictor.get_model_info()
    print(json.dumps(info))
except Exception as e:
    print(json.dumps({'error': str(e)}))
        `,
      ])

      let output = ""

      process.stdout.on("data", (data) => {
        output += data.toString()
      })

      process.on("close", (code) => {
        try {
          const result = JSON.parse(output.trim())
          resolve(result)
        } catch (parseError) {
          reject(new Error(`Failed to parse model info: ${parseError}`))
        }
      })

      process.on("error", (error) => {
        reject(error)
      })
    })
  }
}

// Export singleton instance
export const mlService = MLService.getInstance()
