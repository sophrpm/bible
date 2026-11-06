import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { api } from '../api';
import type { BookSummary, Link, Version } from '../../shared/bible';

type Options = {
  referencesEnabled?: boolean;
  graphEnabled?: boolean;
  version: string;
  selected: string;
  direction: string;
  min: number;
  setVersion: Dispatch<SetStateAction<string>>;
  setMessage: Dispatch<SetStateAction<string>>;
};

/** Keeps server state separate from presentation and ignores requests superseded by navigation. */
export function useBibleData({
  referencesEnabled = true,
  graphEnabled = true,
  version,
  selected,
  direction,
  min,
  setVersion,
  setMessage,
}: Options) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [books, setBooks] = useState<BookSummary[]>([]);
  const [graph, setGraph] = useState<Link[]>([]);
  const [links, setLinks] = useState<Link[]>([]);

  useEffect(() => {
    let active = true;
    api<Version[]>('versions')
      .then((availableVersions) => {
        if (!active) {
          return;
        }
        setVersions(availableVersions);

        if (availableVersions.length) {
          setVersion((current) =>
            availableVersions.some((item) => item.id === current)
              ? current
              : availableVersions[0].id,
          );
        }
      })
      .catch((error: Error) => {
        if (active) {
          setMessage(error.message);
        }
      });
    return () => {
      active = false;
    };
  }, [setVersion, setMessage]);

  useEffect(() => {
    let active = true;
    api<BookSummary[]>('books', { version })
      .then((result) => {
        if (active) {
          setBooks(result);
        }
      })
      .catch((error: Error) => {
        if (active) {
          setMessage(error.message);
        }
      });
    return () => {
      active = false;
    };
  }, [version, setMessage]);

  useEffect(() => {
    let active = true;
    if (!referencesEnabled) {
      setLinks([]);
      return;
    }
    api<Link[]>('references', { id: selected, direction, min })
      .then((result) => {
        if (active) {
          setLinks(result);
        }
      })
      .catch((error: Error) => {
        if (active) {
          setMessage(error.message);
        }
      });
    return () => {
      active = false;
    };
  }, [selected, direction, min, setMessage, referencesEnabled]);

  useEffect(() => {
    let active = true;
    if (!graphEnabled || graph.length) return;
    api<Link[]>('graph')
      .then((result) => {
        if (active) setGraph(result);
      })
      .catch((error: Error) => {
        if (active) setMessage(error.message);
      });
    return () => {
      active = false;
    };
  }, [graphEnabled, graph.length, setMessage]);

  return { versions, setVersions, books, graph, links };
}
