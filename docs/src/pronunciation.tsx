import { Volume2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

/**
 * Says "bricka" out loud with the browser's speech synthesis, in a Swedish
 * voice where the reader has one. Only rendered where speech works, since a
 * speaker that does nothing is worse than none.
 */
export function Pronunciation() {
  const [isSupported, setIsSupported] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const timer = useRef(0)

  useEffect(() => {
    if (!('speechSynthesis' in window)) return
    setIsSupported(true)
    // Voices load asynchronously; asking now means one is ready on click.
    window.speechSynthesis.getVoices()
    return () => {
      window.clearTimeout(timer.current)
      window.speechSynthesis.cancel()
    }
  }, [])

  if (!isSupported) return null

  function speak() {
    const synth = window.speechSynthesis
    synth.cancel()
    window.clearTimeout(timer.current)

    const utterance = new SpeechSynthesisUtterance('bricka')
    utterance.lang = 'sv-SE'
    const swedish = synth
      .getVoices()
      .find((voice) =>
        voice.lang.replace('_', '-').toLowerCase().startsWith('sv')
      )
    if (swedish) utterance.voice = swedish
    utterance.rate = 0.85

    const done = () => setIsSpeaking(false)
    utterance.onend = done
    utterance.onerror = done
    setIsSpeaking(true)
    synth.speak(utterance)
    // Some browsers never fire `onend`.
    timer.current = window.setTimeout(done, 3000)
  }

  return (
    <button
      type="button"
      className="say"
      onClick={speak}
      aria-label="Hear how Bricka is pronounced"
      title="Hear how Bricka is pronounced"
      data-speaking={isSpeaking || undefined}
    >
      <Volume2 size={15} strokeWidth={1.75} aria-hidden />
    </button>
  )
}
