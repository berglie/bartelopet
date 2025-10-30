import { VippsLoginButton } from './_components/vipps-login-button'
import { VippsButtonScript } from './_components/vipps-button-script'
import Link from 'next/link'

export default function TestVippsPage() {
  return (
    <>
      <VippsButtonScript />
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Test Vipps Login
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Test-side for Vipps OAuth-integrasjon
            </p>
          </div>

          <div className="space-y-6">
            {/* Vipps Login Button */}
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-gray-700">
                Vipps Innlogging
              </h2>
              <VippsLoginButton />
            </div>

            {/* Direct API Test */}
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-gray-700">
                Direkte API-test
              </h2>
              <Link
                href="/api/vipps/authorize"
                className="block w-full text-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Test /api/vipps/authorize
              </Link>
            </div>

            {/* Instructions */}
            <div className="border-t border-gray-200 pt-6 space-y-4">
              <h3 className="font-semibold text-gray-700">Testinstruksjoner:</h3>
              <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                <li>Sørg for at du har lagt til Vipps credentials i <code className="bg-gray-100 px-1 py-0.5 rounded">.env.local</code></li>
                <li>Kjør database-migrering: <code className="bg-gray-100 px-1 py-0.5 rounded">supabase migration up</code></li>
                <li>Klikk på &quot;Logg inn med Vipps&quot; over</li>
                <li>Godkjenn i Vipps test-miljø</li>
                <li>Du blir sendt tilbake til appen</li>
              </ol>
            </div>

            {/* Environment Check */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="font-semibold text-blue-900 mb-2">
                Miljøkonfigurasjon
              </h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p>
                  <strong>Vipps aktivert:</strong>{' '}
                  {process.env.NEXT_PUBLIC_ENABLE_VIPPS_LOGIN === 'true' ? '✅ Ja' : '❌ Nei'}
                </p>
                <p>
                  <strong>Miljø:</strong>{' '}
                  {process.env.VIPPS_ENVIRONMENT || 'ikke satt'}
                </p>
              </div>
            </div>

            {/* Documentation Links */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="font-semibold text-gray-700 mb-2">Dokumentasjon:</h3>
              <ul className="text-sm text-blue-600 space-y-1">
                <li>
                  <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-700">
                    VIPPS_TESTING_GUIDE.md
                  </code>{' '}
                  - Komplett testguide
                </li>
                <li>
                  <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-700">
                    VIPPS_OAUTH_IMPLEMENTATION.md
                  </code>{' '}
                  - Teknisk dokumentasjon
                </li>
              </ul>
            </div>

            {/* Back Link */}
            <div className="text-center pt-4">
              <Link
                href="/"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Tilbake til forsiden
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
