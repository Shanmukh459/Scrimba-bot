import { SupabaseVectorStore } from "langchain/vectorstores/supabase"
import { OpenAIEmbeddings } from "langchain/embeddings/openai"
import { createClient } from "@supabase/supabase-js"

const spUrl = import.meta.env.VITE_SUPABASE_URL_LC_CHATBOT
const spApiKey = import.meta.env.VITE_SUPABASE_API_KEY
const openAIApiKey = import.meta.env.VITE_OPENAI_API_KEY

const client = createClient(spUrl, spApiKey)

const embeddings = new OpenAIEmbeddings({ openAIApiKey })

const vectorStore = new SupabaseVectorStore(embeddings, {
  client,
  tablename: "documents",
  queryName: "match_documents",
})

const retriever = vectorStore.asRetriever()

export { retriever }
