export interface Subscriber {
  id: string
  email: string
  createdAt: string
  surveyCompleted: boolean
  survey?: SurveyData
}
export interface SurveyData {
  useCase: UseCaseType
  frequency: FrequencyType
  device: DeviceType
  intention: IntentionType
  submittedAt: string
}
export type UseCaseType = "university"|"exams"|"languages"|"certifications"|"professional"|"other"
export type FrequencyType = "rarely"|"regular"|"daily"
export type DeviceType = "iphone"|"android"|"computer"
export type IntentionType = "free"|"paid"|"watching"

export const USE_CASE_LABELS: Record<UseCaseType,string> = {
  university: "Cours universitaires",
  exams: "Examens / concours",
  languages: "Langues",
  certifications: "Certifications pro",
  professional: "Formation professionnelle",
  other: "Autre",
}
export const FREQUENCY_LABELS: Record<FrequencyType,string> = {
  rarely: "1-2 fois/semaine",
  regular: "3-5 fois/semaine",
  daily: "Tous les jours",
}
export const DEVICE_LABELS: Record<DeviceType,string> = {
  iphone: "iPhone",
  android: "Android",
  computer: "Ordinateur",
}
export const INTENTION_LABELS: Record<IntentionType,string> = {
  free: "Oui, gratuitement",
  paid: "Oui, meme si payant",
  watching: "Je veux juste suivre",
}
