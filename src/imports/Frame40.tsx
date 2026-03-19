import svgPaths from "./svg-3cd23ghgzx";

function Frame41({ isNewEntry = false, hideContent = false }: { isNewEntry?: boolean; hideContent?: boolean }) {
  return (
    <div className={`absolute inset-0 flex flex-col gap-4 sm:gap-6 lg:gap-7 items-center justify-center p-4 ${hideContent ? 'opacity-0 pointer-events-none' : ''}`}>
      <div className="relative flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 lg:w-9 lg:h-9 xl:w-10 xl:h-10" data-name="+">
        <svg className="block w-full h-full" fill="none" preserveAspectRatio="xMidYMid meet" viewBox="0 0 36 36">
          <path d={svgPaths.p9fa9cc0} fill="var(--fill-0, #C2B7AB)" id="+" />
        </svg>
      </div>
      <div className="font-['Syne:Regular',_sans-serif] font-normal text-[#c2b7ab] text-[20px] text-center">
        <p className="leading-[normal] whitespace-nowrap">{isNewEntry ? "New Entry" : "Upload image here"}</p>
      </div>
    </div>
  );
}

export default function Frame40({
  isNewEntry = false,
  hideContent = false,
  fill = false
}: {
  isNewEntry?: boolean;
  hideContent?: boolean;
  fill?: boolean;
}) {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div
        className={`relative bg-[#fff9f3] opacity-50 rounded-[7px] mx-auto ${
          fill ? 'w-full h-full' : 'w-full max-w-[506px] aspect-[506/642]'
        }`}
      >
        <div aria-hidden="true" className={`absolute border-[#c2b7ab] border-[2.52px] border-solid inset-0 pointer-events-none rounded-[7px] ${hideContent ? 'opacity-0' : ''}`} />
        <Frame41 isNewEntry={isNewEntry} hideContent={hideContent} />
      </div>
    </div>
  );
}
