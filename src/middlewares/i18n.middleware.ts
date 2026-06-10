import { Request, Response, NextFunction } from 'express';
import { en } from '../i18n/en';
import { es } from '../i18n/es';
import { fr } from '../i18n/fr';
import { Translations } from '../types/i18n.types';

const translations: Translations = {
  en,
  es,
  fr
};

export const i18nMiddleware = (req: any, res: Response, next: NextFunction) => {
  // Get language from query param, header, or default to 'en'
  const language = (req.query.lang as string) || 
                   req.headers['accept-language']?.split(',')[0].split('-')[0] || 
                   'en';
  
  // Use default language if requested language isn't available
  const validLanguage = translations[language] ? language : 'en';
  
  // Attach to request object
  req.language = validLanguage;
  req.t = (key: string) => {
    const keys = key.split('.');
    let value: any = translations[validLanguage];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fall back to English translation if not found
        let fallbackValue: any = translations.en;
        for (const fk of keys) {
          if (fallbackValue && typeof fallbackValue === 'object' && fk in fallbackValue) {
            fallbackValue = fallbackValue[fk];
          } else {
            return key;
          }
        }
        return fallbackValue;
      }
    }
    
    return value;
  };
  
  next();
};
