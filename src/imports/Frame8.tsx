import { imgGroup1 } from "./svg-2u0uk";

function Group1() {
  return (
    <div className="relative shrink-0 size-[21px]">
      <img className="block max-w-none size-full" src={imgGroup1} />
    </div>
  );
}

function Frame7() {
  return (
    <div className="content-stretch flex gap-2 items-center justify-start relative shrink-0">
      <Group1 />
      <div className="capitalize font-['Syne:Regular',_sans-serif] font-normal leading-[0] relative shrink-0 text-[16px] text-nowrap text-white">
        <p className="leading-[normal] whitespace-pre">Save entry</p>
      </div>
    </div>
  );
}

export default function Frame8() {
  return (
    <div className="bg-[#342209] relative rounded-[6px] size-full">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-2.5 items-start justify-start px-4 py-[13px] relative size-full">
          <Frame7 />
        </div>
      </div>
    </div>
  );
}