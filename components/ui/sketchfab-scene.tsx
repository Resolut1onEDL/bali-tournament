'use client'

import { useState } from 'react'

interface SketchfabSceneProps {
  modelId: string
  className?: string
  autostart?: boolean
  autospin?: number
  preload?: boolean
  transparent?: boolean
  ui_stop?: boolean
  ui_theme?: 'dark' | 'light'
}

export function SketchfabScene({
  modelId,
  className,
  autostart = true,
  autospin = 0.4,
  preload = true,
  transparent = true,
  ui_stop = false,
  ui_theme = 'dark'
}: SketchfabSceneProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  const params = new URLSearchParams({
    autostart: autostart ? '1' : '0',
    autospin: String(autospin),
    preload: preload ? '1' : '0',
    transparent: transparent ? '1' : '0',
    ui_stop: ui_stop ? '1' : '0',
    ui_theme: ui_theme,
    ui_infos: '0',
    ui_inspector: '0',
    ui_watermark: '0',
    ui_watermark_link: '0',
    ui_help: '0',
    ui_settings: '0',
    ui_vr: '0',
    ui_fullscreen: '0',
    ui_annotations: '0',
    ui_controls: '0',
    camera: '0',
    scrollwheel: '0',
    dnt: '1',
  })

  return (
    <div className={`relative ${className || ''}`}>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="loader"></span>
        </div>
      )}
      <iframe
        title="3D Model"
        src={`https://sketchfab.com/models/${modelId}/embed?${params.toString()}`}
        className="w-full h-full border-0"
        allow="autoplay; fullscreen; xr-spatial-tracking"
        onLoad={() => setIsLoaded(true)}
        style={{ opacity: isLoaded ? 1 : 0, transition: 'opacity 0.5s ease' }}
      />
    </div>
  )
}
