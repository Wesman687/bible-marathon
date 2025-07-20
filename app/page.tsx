/* === app/page.tsx === */
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="flex flex-col h-full justify-center items-center w-full px-6 text-center bg-gradient-to-br from-white via-blue-50 to-orange-50 py-20">
      <h1 className="text-4xl sm:text-5xl font-bold text-brandBlue mb-4">
        Join the Bible Reading Marathon
      </h1>
      <p className="text-lg sm:text-xl text-gray-700 max-w-2xl mb-8">
        Watch live as readers from our church family take turns sharing the Word of God day and night. Open to all. No sign-in needed to watch.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <Link href="/viewer">
          <button className="px-6 py-3 bg-brandBlue text-white text-lg font-semibold rounded-full shadow-md hover:bg-brandBlue/80 transition-transform duration-200 hover:scale-105">
            View Live Stream
          </button>
        </Link>
        <Link href="/stage">
          <button className="px-6 py-3 bg-orange-500 text-white text-lg font-semibold rounded-full shadow-md hover:bg-orange-400 transition-transform duration-200 hover:scale-105">
            Reader Staging
          </button>
        </Link>
      </div>
    </div>
  )
}
