
import { useApp } from './useApp';
import { translations } from '../i18n';

export const useTranslations = () => {
  const { language } = useApp();
  return translations[language];
};

export const VOICES = [
    { name: 'Zephyr', value: 'Zephyr' },
    { name: 'Puck', value: 'Puck' },
    { name: 'Charon', value: 'Charon' },
    { name: 'Kore', value: 'Kore' },
    { name: 'Fenrir', value: 'Fenrir' },
];
