import { useLatestSpeeches } from "@/features/search/hooks/useLatestSpeeches";
import type { Speech } from "@/types/kokkai";

const HEADING_ID = "latest-speech-heading";

type LatestSpeechBodyProps = {
  speech?: Speech;
  isPending: boolean;
  isError: boolean;
};

function LatestSpeechBody({
  speech,
  isPending,
  isError,
}: LatestSpeechBodyProps) {
  if (isPending) return <p role="status">新しい発言を読み込んでいます</p>;
  if (isError) {
    return (
      <div role="alert">
        <p>新しい発言を読み込めませんでした</p>
        <p>時間をおいて、もう一度お試しください</p>
      </div>
    );
  }
  if (speech === undefined) return <p>新しい発言はありません</p>;
  return (
    <article>
      <p>{speech.speaker}</p>
      <p className="whitespace-pre-line">{speech.text}</p>
    </article>
  );
}

// 発言カードの見た目は #19 で作る。ここでは発言者と本文だけを出す
export function LatestSpeech() {
  return (
    <section aria-labelledby={HEADING_ID}>
      <h2 id={HEADING_ID}>新しい発言</h2>
      <LatestSpeechBody {...useLatestSpeeches()} />
    </section>
  );
}
