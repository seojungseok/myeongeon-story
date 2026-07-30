import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-prose flex flex-col items-center py-24 text-center">
      <p className="text-5xl">🍂</p>
      <h1 className="mt-6 text-2xl font-bold text-ink">
        이야기를 찾을 수 없어요
      </h1>
      <p className="mt-3 text-subtle">
        주소가 바뀌었거나, 아직 준비되지 않은 이야기일 수 있어요.
      </p>
      <Link href="/" className="btn mt-8">
        홈으로 돌아가기
      </Link>
    </div>
  );
}
