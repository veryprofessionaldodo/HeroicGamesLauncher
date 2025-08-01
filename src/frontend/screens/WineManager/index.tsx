import './index.css'

import ContextProvider from 'frontend/state/ContextProvider'
import { UpdateComponent } from 'frontend/components/UI'

import React, { lazy, useContext, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Tab, Tabs } from '@mui/material'
import {
  TypeCheckedStoreFrontend,
  wineDownloaderInfoStore
} from 'frontend/helpers/electronStores'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCheck,
  faSyncAlt,
  faWarning
} from '@fortawesome/free-solid-svg-icons'
import { WineVersionInfo, Type, WineManagerUISettings } from 'common/types'
import { hasHelp } from 'frontend/hooks/hasHelp'

const WineItem = lazy(
  async () => import('frontend/screens/WineManager/components/WineItem')
)

const configStore = new TypeCheckedStoreFrontend('wineManagerConfigStore', {
  cwd: 'store'
})

export default function WineManager(): JSX.Element | null {
  const { t } = useTranslation()

  hasHelp(
    'wineManager',
    t('help.title.wineManager', 'Wine Manager'),
    <p>
      {t(
        'help.content.wineManager',
        'Install different versions of Wine, Proton, Crossover, etc.'
      )}
    </p>
  )

  const { refreshWineVersionInfo, refreshing, platform, isIntelMac } =
    useContext(ContextProvider)
  const isLinux = platform === 'linux'

  const protonge: WineManagerUISettings = {
    type: 'GE-Proton',
    value: 'protonge',
    enabled: isLinux
  }
  const gamePortingToolkit: WineManagerUISettings = {
    type: 'Game-Porting-Toolkit',
    value: 'gpt',
    enabled: !isLinux
  }

  const wineStagingMacOS: WineManagerUISettings = {
    type: 'Wine-Staging-macOS',
    value: 'winestagingmacos',
    enabled: !isLinux
  }

  const wineCrossover: WineManagerUISettings = {
    type: 'Wine-Crossover',
    value: 'winecrossover',
    enabled: !isLinux
  }

  const getDefaultRepository = (): WineManagerUISettings => {
    if (isLinux) {
      return protonge
    } else if (isIntelMac) {
      return wineCrossover
    } else {
      return gamePortingToolkit
    }
  }

  const [repository, setRepository] = useState<WineManagerUISettings>(
    getDefaultRepository()
  )

  const [wineManagerSettings, setWineManagerSettings] = useState<
    WineManagerUISettings[]
  >([
    protonge,
    { type: 'Wine-GE', value: 'winege', enabled: isLinux },
    gamePortingToolkit,
    wineCrossover,
    wineStagingMacOS
  ])

  const getWineVersions = (repo: Type) => {
    let versions = wineDownloaderInfoStore.get('wine-releases', [])

    if (repo.startsWith('Wine-GE')) {
      versions = versions.filter((version) => version.type === 'Wine-GE')
      return versions.filter((version) => !version.version.endsWith('LoL'))
    } else {
      return versions.filter((version) => version.type === repo)
    }
  }

  const [wineVersions, setWineVersions] = useState<WineVersionInfo[]>(
    getWineVersions(repository.type)
  )

  const handleChangeTab = (
    e: React.SyntheticEvent,
    repo: WineManagerUISettings
  ) => {
    setRepository(repo)
    setWineVersions(getWineVersions(repo.type))
  }

  useEffect(() => {
    const oldWineManagerSettings = configStore.get_nodefault(
      'wine-manager-settings'
    )
    if (oldWineManagerSettings) {
      setWineManagerSettings(oldWineManagerSettings)
    }
  }, [])

  useEffect(() => {
    const removeListener = window.api.handleWineVersionsUpdated(() => {
      setWineVersions(getWineVersions(repository.type))
    })
    return () => {
      removeListener()
    }
  }, [repository])

  const wineVersionExplanation = useMemo(() => {
    switch (repository.type) {
      case 'Wine-GE':
        return (
          <div className="infoBox">
            <FontAwesomeIcon icon={faWarning} color={'orange'} />
            {t(
              'wineExplanation.wine-ge',
              'Wine-GE-Proton is a Wine variant created by Glorious Eggroll. It has been deprecated in favor of GE-Proton with the umu launcher.'
            )}
          </div>
        )
      case 'GE-Proton':
        return (
          <div className="infoBox">
            <FontAwesomeIcon icon={faCheck} color={'green'} />
            {t(
              'wineExplanation.proton-ge',
              'GE-Proton is a Proton variant created by Glorious Eggroll. It is meant to be used along with the umu launcher (default in Heroic).'
            )}
          </div>
        )
      default:
        return <></>
    }
  }, [repository])

  return (
    <>
      <h4 style={{ paddingTop: 'var(--space-md)' }}>
        {t('wine.manager.title', 'Wine Manager')}
      </h4>
      <div className="wineManager">
        <span className="tabsWrapper">
          <Tabs
            className="tabs"
            value={repository.value}
            onChange={(e, value) => {
              const repo = wineManagerSettings.find(
                (setting) => setting.value === value
              )
              if (repo) {
                handleChangeTab(e, repo)
              }
            }}
            centered={true}
          >
            {wineManagerSettings.map(({ type, value, enabled }) => {
              if (enabled) {
                return <Tab value={value} label={type} key={value} />
              }
              return null
            })}
          </Tabs>
          <button
            className={'FormControl__button'}
            title={t('generic.library.refresh', 'Refresh Library')}
            onClick={() => refreshWineVersionInfo(true)}
          >
            <FontAwesomeIcon
              className={'FormControl__segmentedFaIcon'}
              icon={faSyncAlt}
            />
          </button>
        </span>
        {wineVersionExplanation}
        {wineVersions.length ? (
          <div
            style={
              !wineVersions.length ? { backgroundColor: 'transparent' } : {}
            }
            className="wineList"
          >
            <div className="gameListHeader">
              <span>{t('info.version', 'Wine Version')}</span>
              <span>{t('wine.release', 'Release Date')}</span>
              <span>{t('wine.size', 'Size')}</span>
              <span>{t('wine.actions', 'Action')}</span>
            </div>
            {refreshing && <UpdateComponent />}
            {!refreshing &&
              !!wineVersions.length &&
              wineVersions.map((release) => {
                return <WineItem key={release.version} {...release} />
              })}
          </div>
        ) : (
          <h5 className="wineList">
            {t(
              'wine.manager.not-found',
              'No Wine versions found. Please click the refresh icon to try again.'
            )}
          </h5>
        )}
      </div>
    </>
  )
}
