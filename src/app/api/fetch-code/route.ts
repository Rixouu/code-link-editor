import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Failed to fetch code')
    }
    const code = await response.text()
    return new NextResponse(code)
  } catch (error) {
    console.error('Error fetching code:', error)
    return NextResponse.json({ error: 'Failed to fetch code' }, { status: 500 })
  }
}