import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <SignIn
      appearance={{
        elements: {
          rootBox: 'w-full max-w-md',
          card: 'bg-white shadow-sm border border-karis-stone-100 rounded-xl',
          headerTitle: 'font-heading text-karis-green-900',
          formButtonPrimary:
            'bg-karis-green-900 hover:bg-karis-green-700 text-white',
          footerActionLink: 'text-karis-gold-700 hover:text-karis-gold-500',
        },
      }}
    />
  )
}
