import { useEffect } from 'react';

export function useQuotationKeyboard(handlers: {
  onFocusSearch?: () => void;
  onSave?: () => void;
  onClearSearch?: () => void;
  onRowDown?: () => void;
  onRowUp?: () => void;
  onAddFocused?: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT';

      if (e.key === '/' && !isInput) {
        e.preventDefault();
        handlers.onFocusSearch?.();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handlers.onSave?.();
        return;
      }

      if (e.key === 'Escape' && !e.ctrlKey && !e.metaKey) {
        handlers.onClearSearch?.();
        return;
      }

      if (isInput && target.getAttribute('data-product-search') !== 'true') return;
      if (target.getAttribute('data-product-qty-input')) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        handlers.onRowDown?.();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handlers.onRowUp?.();
      } else if (e.key === 'Enter' && !e.shiftKey) {
        const tag = target.tagName;
        if (tag !== 'TEXTAREA') {
          e.preventDefault();
          handlers.onAddFocused?.();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handlers]);
}
