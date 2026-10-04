import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { jsPDF } from 'jspdf'

export const dynamic = 'force-dynamic'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  const deck = await prisma.deck.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: { cards: { orderBy: { position: 'asc' } } },
  })
  if (!deck) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 18
  const contentW = pageW - margin * 2
  let y = margin

  // Colors
  const violet = [109, 40, 217] as const  // violet-600
  const gray = [107, 114, 128] as const
  const darkGray = [31, 41, 55] as const
  const lightBg = [245, 243, 255] as const // violet-50

  function addPage() {
    doc.addPage()
    y = margin
  }

  function checkSpace(needed: number) {
    if (y + needed > pageH - margin) addPage()
  }

  // Title page header
  doc.setFillColor(...lightBg)
  doc.roundedRect(margin, y, contentW, 28, 4, 4, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...violet)
  doc.text('FlashGenius', margin + 6, y + 12)
  doc.setFontSize(11)
  doc.setTextColor(...gray)
  doc.text(deck.name, margin + 6, y + 22)
  doc.setFontSize(9)
  doc.text(deck.cards.length + ' cartes', pageW - margin - 6, y + 22, { align: 'right' })
  y += 36

  // Cards
  deck.cards.forEach((card, i) => {
    // Estimate height needed
    const qLines = doc.setFont('helvetica', 'bold').setFontSize(10).splitTextToSize('Q: ' + card.question, contentW - 16)
    const aLines = doc.setFont('helvetica', 'normal').setFontSize(10).splitTextToSize('R: ' + card.answer, contentW - 16)
    const catH = card.category ? 8 : 0
    const cardH = 12 + catH + qLines.length * 5 + 4 + aLines.length * 5 + 8

    checkSpace(cardH + 4)

    // Card background
    doc.setFillColor(252, 252, 253)
    doc.setDrawColor(229, 231, 235)
    doc.roundedRect(margin, y, contentW, cardH, 3, 3, 'FD')

    // Card number
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...violet)
    doc.text('#' + (i + 1), margin + 6, y + 6)

    // Category badge
    if (card.category) {
      doc.setFillColor(...lightBg)
      const badgeW = doc.getTextWidth(card.category) + 6
      doc.roundedRect(margin + 20, y + 2.5, badgeW, 5.5, 2, 2, 'F')
      doc.setFontSize(7)
      doc.setTextColor(...violet)
      doc.text(card.category, margin + 23, y + 6.2)
    }

    let cardY = y + 10 + catH

    // Question
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...darkGray)
    doc.text(qLines, margin + 8, cardY)
    cardY += qLines.length * 5 + 3

    // Separator
    doc.setDrawColor(229, 231, 235)
    doc.setLineWidth(0.3)
    doc.line(margin + 8, cardY, pageW - margin - 8, cardY)
    cardY += 4

    // Answer
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...gray)
    doc.text(aLines, margin + 8, cardY)

    y += cardH + 4
  })

  // Footer on last page
  doc.setFontSize(7)
  doc.setTextColor(180, 180, 180)
  doc.text('Genere par FlashGenius — flashgenius-rho.vercel.app', pageW / 2, pageH - 8, { align: 'center' })

  const buffer = Buffer.from(doc.output('arraybuffer'))
  const safeName = deck.name.replace(/[^a-z0-9]/gi, '_')

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${safeName}.pdf"`,
    },
  })
}
