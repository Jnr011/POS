import type { ReceiptElement } from '../lib/receiptBuilder';

export function ReceiptPreview({ elements }: { elements: ReceiptElement[] }) {
  return (
    <div className="bg-white text-black font-mono text-[11px] leading-snug p-4 w-full shadow-sm">
      {elements.map((el, i) => {
        switch (el.type) {
          case 'title':
            return <p key={i} className="text-center font-bold text-base mb-1">{el.text}</p>;
          case 'subtitle':
            return <p key={i} className="text-center font-semibold mb-1">{el.text}</p>;
          case 'line':
            return <div key={i} className="border-b border-dashed border-gray-300 my-1.5" />;
          case 'text':
            return (
              <p key={i} className={[
                el.align === 'center' && 'text-center',
                el.align === 'right' && 'text-right',
                el.bold && 'font-bold',
                el.size === 'double' && 'text-lg leading-tight',
              ].filter(Boolean).join(' ')}>
                {el.text || '\u00A0'}
              </p>
            );
          case 'table': {
            const total = el.columnWidths?.reduce((s, w) => s + w, 0) || 48;
            return (
              <table key={i} className="w-full text-[11px] mb-1">
                {el.header && (
                  <thead>
                    <tr>
                      {el.header.map((h, j) => (
                        <th key={j} className="text-left font-bold pb-0.5" style={{ width: el.columnWidths ? `${(el.columnWidths[j] / total) * 100}%` : undefined }}>
                          {h.text}
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {el.rows.map((row, r) => (
                    <tr key={r}>
                      {row.map((cell, c) => (
                        <td key={c} className="align-top" style={{ width: el.columnWidths ? `${(el.columnWidths[c] / total) * 100}%` : undefined }}>
                          {cell.text}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          }
          case 'feed':
            return <div key={i} style={{ height: el.lines * 10 }} />;
          case 'cut':
            return <div key={i} className="border-t border-dashed border-gray-400 mt-2 pt-1 text-center text-[9px] text-gray-400">✂ cut here</div>;
        }
      })}
    </div>
  );
}
