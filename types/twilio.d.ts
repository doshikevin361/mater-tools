declare global {
  interface Window {
    Twilio: {
      Device: new (
        token: string,
        options?: {
          closeProtection?: boolean
          codecPreferences?: string[]
          fakeLocalDTMF?: boolean
          enableRingingState?: boolean
        }
      ) => TwilioDevice
    }
  }
}

interface TwilioDevice {
  on(event: string, callback: (data?: any) => void): void
  connect(params?: { params?: { To: string } }): Promise<TwilioCall>
  disconnectAll(): void
}

interface TwilioCall {
  disconnect(): void
  mute(muted: boolean): void
}

export {}