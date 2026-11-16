import { Suspense, useState } from 'react';
import type { ReactNode } from 'react';
import CollapsibleSection from './CollapsibleSection';

interface Props {
  id: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
  /** The panel, which is only rendered once the section has been opened. */
  children: ReactNode;
}

/**
 * A collapsible section whose contents are not loaded until it is opened.
 *
 * Team mode and the signature checker are whole features — a CSV parser, a
 * ZIP writer, a second set of panels — that most visits never open. Mounting
 * them lazily keeps their code out of the first load; keeping them mounted
 * afterwards means closing the section does not throw away what was typed
 * into it.
 */
export default function LazySection({ id, title, subtitle, icon, children }: Props) {
  const [open, setOpen] = useState(false);
  const [everOpened, setEverOpened] = useState(false);

  return (
    <CollapsibleSection
      id={id}
      title={title}
      subtitle={subtitle}
      icon={icon}
      open={open}
      onToggle={() => {
        setOpen((value) => !value);
        setEverOpened(true);
      }}
    >
      {everOpened ? (
        <Suspense fallback={<p className="text-sm text-hint">Loading…</p>}>{children}</Suspense>
      ) : null}
    </CollapsibleSection>
  );
}
