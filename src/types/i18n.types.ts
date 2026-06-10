export interface Translation {
  [key: string]: string | Translation;
}

export interface Translations {
  en: Translation;
  [language: string]: Translation;
}
