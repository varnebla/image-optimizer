import { defaultLang, languages, ui, type Lang} from './ui'

export { languages };

export function getLangFromUrl(url: URL): Lang {
  const [, lang] = url.pathname.split('/');
  if(lang in languages) return lang as Lang
  return defaultLang;
}

export function useTranslations(lang: Lang) {
  return function t(key: keyof (typeof ui)[Lang]) {
    return ui[lang][key] ?? ui[defaultLang][key];
  }
}