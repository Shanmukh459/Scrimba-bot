import { ChatOpenAI } from "langchain/chat_models/openai"
import { PromptTemplate } from "langchain/prompts"
import { StringOutputParser } from "langchain/schema/output_parser"
import { retriever } from "./utils/retriever.js"
import { combineDocs } from "./utils/combineDocs.js"
import {
  RunnablePassthrough,
  RunnableSequence,
} from "langchain/schema/runnable"
import { formatConvHistory } from "./utils/formatConvHistory.js"

document.addEventListener("submit", (e) => {
  e.preventDefault()
  progressConversation()
})

const openAIApiKey = import.meta.env.VITE_OPENAI_API_KEY
const llm = new ChatOpenAI({ openAIApiKey })

const standaloneQuestionTemplate = `Given some conversation history (if any) and a question, convert the question to a standalone question. 
conversation history: {convHistory}
question: {question} 
standalone question:`

const standaloneQuestionPrompt = PromptTemplate.fromTemplate(
  standaloneQuestionTemplate
)

const answerTemplate = `You are a helpful and enthusiastic support bot who can answer a given question about Scrimba based on the context provided and the conversation history. Try to find the answer in the context. If the answer is not given in the context, find the answer in the conversation history if possible. If you really don't know the answer, say "I'm sorry, I don't know the answer to that." And direct the questioner to email help@scrimba.com. Don't try to make up an answer. Always speak as if you were chatting to a friend.
context: {context}
conversation history: {convHistory}
question: {question}
answer:  `

const answerPrompt = PromptTemplate.fromTemplate(answerTemplate)

const standaloneChain = RunnableSequence.from([
  standaloneQuestionPrompt,
  llm,
  new StringOutputParser(),
])

const retrieverChain = RunnableSequence.from([
  (prevOutput) => prevOutput.standaloneQuestion,
  retriever,
  combineDocs,
])

const answerChain = RunnableSequence.from([
  answerPrompt,
  llm,
  new StringOutputParser(),
])

const chain = RunnableSequence.from([
  {
    standaloneQuestion: standaloneChain,
    originalInput: new RunnablePassthrough(),
    convHistory: new RunnablePassthrough(),
  },
  {
    context: retrieverChain,
    question: ({ originalInput }) => originalInput.question,
    convHistory: ({ originalInput }) => originalInput.convHistory,
  },
  answerChain,
])

// const response = await chain.invoke({
//   question:
//     "What are the technical requirements for running Scrimba? I only have a very old laptop which is not that powerful.",
// })

const convHistory = []

async function progressConversation() {
  const userInput = document.getElementById("user-input")
  const chatbotConversation = document.getElementById(
    "chatbot-conversation-container"
  )
  const question = userInput.value
  userInput.value = ""

  // add human message
  const newHumanSpeechBubble = document.createElement("div")
  newHumanSpeechBubble.classList.add("speech", "speech-human")
  chatbotConversation.appendChild(newHumanSpeechBubble)
  newHumanSpeechBubble.textContent = question
  chatbotConversation.scrollTop = chatbotConversation.scrollHeight
  const response = await chain.invoke({
    question: question,
    convHistory: formatConvHistory(convHistory),
  })

  convHistory.push(question)
  convHistory.push(response)

  // add AI message
  const newAiSpeechBubble = document.createElement("div")
  newAiSpeechBubble.classList.add("speech", "speech-ai")
  chatbotConversation.appendChild(newAiSpeechBubble)
  newAiSpeechBubble.textContent = response
  chatbotConversation.scrollTop = chatbotConversation.scrollHeight
}
