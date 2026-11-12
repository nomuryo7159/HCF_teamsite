'use client';

import { useRef, type ReactNode } from 'react';

export default function GiftiaDetail({ label, title, children }: {
  label: ReactNode;
  title: string;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button type="button" className="giftia-detail-trigger" aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>
        {label}
      </button>
      <dialog ref={dialog} className="giftia-dialog" aria-label={title}>
        <header>
          <h2>{title}</h2>
          <form method="dialog"><button type="submit" aria-label="閉じる">閉じる</button></form>
        </header>
        {children}
      </dialog>
    </>
  );
}
