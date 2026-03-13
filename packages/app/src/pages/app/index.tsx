import { java } from '@codemirror/lang-java';
import { javascript } from '@codemirror/lang-javascript';
import { markdown } from '@codemirror/lang-markdown';
import { python } from '@codemirror/lang-python';
import { rust } from '@codemirror/lang-rust';
import { yaml } from '@codemirror/lang-yaml';
import { oneDark } from '@codemirror/theme-one-dark';
import CodeMirror from '@uiw/react-codemirror';
import { useState } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const languages: Record<string, () => any> = {
  java,
  javascript,
  markdown,
  python,
  rust,
  yaml,
};

export default function HomePage() {
  const [{ language = 'javascript', code = '' }, setState] = useState<{
    language: string;
    code: string;
  }>({
    language: 'javascript',
    code: `function hello() {\n  console.log("Hello world")\n}`,
  });

  return (
    <div className="bg-base-100 flex h-screen w-screen text-neutral-200">
      <div className="flex w-full flex-col">
        <select
          id="language"
          name="language"
          className="select select-ghost w-full"
          value={language}
          onChange={(event) =>
            setState((previous) => ({
              ...previous,
              language: event.target.value,
            }))
          }>
          <option value="java">Java</option>
          <option value="javascript">Javascript</option>
          <option value="python">Python</option>
          <option value="markdown">Markdown</option>
          <option value="rust">Rust</option>
          <option value="yaml">YAML</option>
        </select>
        <div className="grow">
          <CodeMirror
            value={code}
            height="100%"
            className="bg-base-100 h-full w-full"
            theme={oneDark}
            extensions={[languages[language]()]}
            onChange={(value) =>
              setState((previous) => ({ ...previous, code: value }))
            }
          />
        </div>
      </div>
    </div>
  );
}
