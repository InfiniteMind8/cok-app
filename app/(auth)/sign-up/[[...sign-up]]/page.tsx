import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <SignUp
      appearance={{
        variables: {
          colorPrimary: 'oklch(0.20 0.05 155)',
          colorTextOnPrimaryBackground: 'oklch(0.94 0.04 80)',
          colorBackground: 'oklch(1 0 0)',
          colorInputBackground: 'oklch(1 0 0)',
          colorText: 'oklch(0.22 0.01 70)',
          colorTextSecondary: 'oklch(0.65 0.02 70)',
          colorInputText: 'oklch(0.22 0.01 70)',
          colorDanger: 'oklch(0.58 0.21 25)',
          borderRadius: '0.75rem',
          fontFamily: 'var(--font-inter), system-ui, sans-serif',
          fontFamilyButtons: 'var(--font-inter), system-ui, sans-serif',
          fontSize: '0.875rem',
        },
        elements: {
          rootBox: 'w-full max-w-[420px]',
          card: 'border border-karis-stone-300 shadow-[0_4px_16px_oklch(0.20_0.05_155_/_0.08)] rounded-2xl',
          headerTitle: 'font-display text-karis-green-900',
          formButtonPrimary:
            'bg-karis-green-900 text-karis-gold-100 font-body font-medium hover:bg-karis-green-700 transition-colors',
          footerActionLink: 'text-karis-green-700 hover:text-karis-green-500 font-body',
          formFieldLabel: 'font-body text-xs font-medium text-karis-stone-700',
          formFieldInput:
            'font-body border-karis-stone-300 focus:ring-karis-green-700 focus:border-karis-green-700',
          identityPreviewText: 'font-body text-karis-stone-900',
          formResendCodeLink: 'text-karis-green-700 hover:text-karis-green-500 font-body text-xs',
        },
      }}
    />
  )
}
