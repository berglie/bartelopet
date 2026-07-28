import { cn } from '@/app/_shared/lib/utils/cn';

export function TerrainLines({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 h-full w-full', className)}
      viewBox="0 0 1200 700"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
    >
      <path
        d="M-80 173C64 50 213 59 330 130c107 65 160 186 294 190 133 4 181-110 294-140 123-33 252 34 366 133"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M-91 222C49 93 205 95 329 169c109 65 166 185 299 190 135 5 192-102 305-132 124-32 248 27 362 121"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M-95 276C40 141 204 139 334 213c112 64 172 181 306 188 137 7 203-94 316-122 122-31 238 20 350 106"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M-89 335C43 195 206 190 342 260c116 60 181 173 315 181 138 9 212-86 325-112 119-27 227 16 337 94"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M-70 401c126-143 287-153 429-88 120 55 190 163 325 173 139 10 222-78 334-100 116-23 217 13 326 84"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M-37 472c120-143 278-158 425-99 124 50 201 152 336 163 141 12 232-68 342-87 113-19 208 11 317 75"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M7 548c115-140 269-160 421-107 128 45 212 139 348 152 142 13 241-57 349-72 110-15 200 10 309 67"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M60 627c111-134 261-157 416-111 132 39 224 126 361 140 143 15 250-46 356-57 107-11 194 10 303 61"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}
