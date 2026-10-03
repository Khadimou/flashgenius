import OpenAI from 'openai'

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export interface GeneratedCard {
  question: string
  answer: string
  category: string
}

export async function generateFlashcards(text: string): Promise<GeneratedCard[]> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    temperature: 0.6,
    max_tokens: 2048,
    messages: [
      {
        role: 'system',
        content: `Tu es un expert en creation de flashcards pedagogiques efficaces.
Analyse le texte fourni et genere des flashcards de qualite.
Regles :
- Questions precises et directes
- Reponses concises (1 a 3 phrases max)
- Regroupe par categories thematiques coherentes (2 a 5 categories max)
- Entre 5 et 25 cartes selon la richesse du contenu
- Tout en francais
Retourne UNIQUEMENT un JSON valide : {"cards":[{"question":"...","answer":"...","category":"..."}]}`,
      },
      { role: 'user', content: text },
    ],
  })

  const raw = completion.choices[0].message.content ?? '{}'
  const parsed = JSON.parse(raw) as { cards?: GeneratedCard[] }
  return parsed.cards ?? []
}
