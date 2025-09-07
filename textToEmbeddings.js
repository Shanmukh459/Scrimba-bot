import { OpenAIEmbeddings } from "langchain/embeddings/openai"
import { createClient } from "@supabase/supabase-js"
import { SupabaseVectorStore } from "langchain/vectorstores/supabase"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"

try {
  const result = await fetch("scrimba-info.txt")
  const text = await result.text()
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    seperators: ["\n\n", "\n", " ", ""],
    chunkOverlap: 50,
  })
  const output = await textSplitter.splitText(text)
  console.log(output)
  const sbUrl = process.env.SUPABASE_URL_LC_CHATBOT
  const sbApiKey = process.env.SUPABASE_API_KEY

  const client = createClient(spUrl, sbApiKey)
  await SupabaseVectorStore.fromDocuments(output, new OpenAIEmbeddings(), {
    client,
    tableName: "documents",
  })
} catch (err) {
  console.log(err)
}
