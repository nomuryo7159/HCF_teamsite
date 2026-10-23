import { ArrowUpRight, Plus } from "lucide-react";
import { type Entry } from "./types";
import { Edit } from "./common";

const profileRows = [
  ["mbti", "MBTI"],
  ["focus", "注力"],
  ["schedule", "時間"],
  ["values", "価値観"],
] as const;

export default function MemberCard({
  member,
  index,
  onEdit,
}: {
  member: Entry<"member">;
  index: number;
  onEdit?: () => void;
}) {
  const d = member.data;
  const pending = d.status === "pending";
  const rows = profileRows.filter(([key]) => d[key]);
  return (
    <article
      className={"member-card profile-card member-color-" + (index % 3)}
      id={"member-" + member.id}
    >
      <div className="member-card-top">
        <span className="member-number">
          MEMBER / {String(index + 1).padStart(2, "0")}
        </span>
        {onEdit && <Edit label={d.name} onClick={onEdit} />}
      </div>
      <div className="avatar">
        {pending ? <Plus size={36} strokeWidth={1.4} /> : d.name.slice(0, 1)}
      </div>
      <h4>{d.name}</h4>
      <p className="member-role">
        {pending ? "新しい仲間を待っています" : d.role || "役割はこれから"}
      </p>
      {!!d.tags?.length && (
        <ul className="member-tags">
          {d.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      )}
      {rows.length > 0 && (
        <dl className="member-profile">
          {rows.map(([key, label]) => (
            <div key={key}>
              <dt>{label}</dt>
              <dd>{d[key]}</dd>
            </div>
          ))}
        </dl>
      )}
      <p className="member-bio pre-wrap">
        {d.bio ||
          (pending
            ? "参加が決まったら、ここに紹介を追加します。"
            : "自己紹介はこれから追加していきます。")}
      </p>
      {d.url && (
        <a
          className="member-link"
          href={d.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          自己紹介ページ
          <ArrowUpRight size={14} />
        </a>
      )}
    </article>
  );
}
