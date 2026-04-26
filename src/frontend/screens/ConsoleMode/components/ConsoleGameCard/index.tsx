import classNames from 'classnames'
import './index.scss'
import { GameInfo } from 'common/types'
import { CachedImage } from 'frontend/components/UI'
import fallBackImage from 'frontend/assets/heroic_card.jpg'
import { getImageFormatting } from 'frontend/screens/Library/components/GameCard/constants'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'

export interface ConsoleGameCardProps {
  game: GameInfo
  onFocus?: () => void
  onClick?: () => void
  needsUpdate?: boolean
}

export default function ConsoleGameCard(props: ConsoleGameCardProps) {
  const { t } = useTranslation()
  const { game, onFocus, onClick, needsUpdate } = props
  const [isFocused, setIsFocused] = useState(false)

  return (
    <button
      key={`${game.runner}-${game.app_name}`}
      //   ref={(el) => {
      //     cardRefs.current[i] = el
      //   }}
      className={classNames('consoleCard', {
        focused: isFocused
      })}
      onFocus={() => {
        setIsFocused(true)
        if (onFocus) onFocus()
      }}
      onBlur={() => setIsFocused(false)}
      //   tabIndex={isFocused ? 0 : -1}
      onClick={onClick}
      //   onMouseEnter={() => setFocusedIndex(i)}
      //   onFocus={() => setFocusedIndex(i)}
    >
      <CachedImage
        src={getImageFormatting(game.art_square, game.runner) || fallBackImage}
        alt={game.title}
        className="consoleCardArt"
      />
      {needsUpdate && (
        <span className="consoleCardBadge">
          {t('console.card.needsUpdate', 'Needs update')}
        </span>
      )}
    </button>
  )
}
