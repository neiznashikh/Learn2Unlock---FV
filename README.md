# Learn2Unlock 🔒📚

![Build Status](https://github.com/${{ github.repository }}/actions/workflows/android.yml/badge.svg)

**Learn2Unlock** — это умный блокировщик приложений для Android, который превращает экранное время в время для обучения.

## 📥 Как скачать APK?
1. Перейдите в раздел **Releases** (справа на главной странице репозитория).
2. Найдите **Latest Build**.
3. Скачайте файл `.apk` в разделе **Assets**.
4. Установите его на Android (разрешите установку из неизвестных источников).

## Как это работает?
1. Ребенок пытается открыть развлекательное приложение (YouTube, TikTok, Instagram).
2. Приложение блокируется, и поверх него открывается экран **Learn2Unlock**.
3. Чтобы разблокировать доступ, необходимо правильно решить 3 задания (математика, логика или языки), сгенерированные ИИ.

## Технологии
- **Frontend:** React + Tailwind CSS + Framer Motion
- **Android:** Kotlin + Accessibility Service (Служба специальных возможностей)
- **AI:** Google Gemini API

## Разработка
Для сборки APK используется GitHub Actions. Файл сборки находится в `.github/workflows/android.yml`.
