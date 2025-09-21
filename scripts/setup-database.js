const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")

async function setupDatabase() {
  console.log("🚀 Setting up database...")

  try {
    // Check if Supabase CLI is installed
    execSync("supabase --version", { stdio: "ignore" })
  } catch (error) {
    console.error("❌ Supabase CLI not found. Please install it first:")
    console.error("npm install -g supabase")
    process.exit(1)
  }

  // Run SQL scripts in order
  const scriptsDir = path.join(__dirname, "../scripts")
  const sqlFiles = [
    "001_create_attack_detection_tables.sql",
    "002_create_sample_data.sql",
    "003_create_rls_policies.sql",
  ]

  for (const file of sqlFiles) {
    const filePath = path.join(scriptsDir, file)
    if (fs.existsSync(filePath)) {
      console.log(`📄 Running ${file}...`)
      try {
        execSync(`supabase db push --file ${filePath}`, { stdio: "inherit" })
        console.log(`✅ ${file} completed`)
      } catch (error) {
        console.error(`❌ Error running ${file}:`, error.message)
        process.exit(1)
      }
    } else {
      console.warn(`⚠️  File not found: ${file}`)
    }
  }

  console.log("🎉 Database setup completed successfully!")
}

setupDatabase().catch(console.error)
