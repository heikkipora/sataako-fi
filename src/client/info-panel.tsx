import classNames from 'classnames'
import React from 'react'

export class InfoPanel extends React.PureComponent<{collapsed: boolean, onInfoPanelToggle: () => void}> {
  render() {
    const {collapsed} = this.props
    const buttonText = collapsed ? 'Tietoa palvelusta' : 'SULJE'
    const className = classNames('info-panel', {'info-panel--collapsed': collapsed})

    return <div className={className}>
      <div className="info-panel__toggle" onClick={this.props.onInfoPanelToggle}>{buttonText}</div>
      {!collapsed && this.renderContent()}
    </div>
  }

  renderContent() {
    return <div className="info-panel__content">
      <div className="info-panel__logo">
        <img src="/img/sataako-logo-white.png" alt="Sataako kohta logo - sataako.fi" title="Sataako kohta logo - sataako.fi" />
        <h1>Sataako<br/>kohta?</h1>
      </div>
      <div className="info-panel__description">
        <p>Live-sadetilanne kätevästi Suomessa ja lähialueilla. Milloin lähteä lenkille, uimarannalle, piknikille tai kalaan? Katso, missä lähin sadepilvi luuraa! Unohda hankalat täsmäsääpalvelut ja tuntiennusteet.</p>
        <p>Sadetutkakuva ja salamatiedot päivittyvät automaattisesti ja jatkuvasti, viiden minuutin välein. Mitä lähempänä väri on punaista, sitä enemmän sataa.</p>
        <p>Tämän palvelun on tehnyt vapaa-ajallaan <a href="https://twitter.com/p0ra" target="_blank" rel="noopener noreferrer" title="Heikki Pora Twitter">Heikki&nbsp;Pora</a>, jonka sade pääsi yllättämään.</p>
        <p>Kartalla esitetään <a href="https://ilmatieteenlaitos.fi/avoin-data/" target="_blank" rel="noopener noreferrer" title="Ilmatieteenlaitos Avoin Data">Ilmatieteen laitoksen</a> toimittamia tietoaineistoja. Tiedot ovat kaikille avointa tietoa eli <a href="http://www.hri.fi/fi/mita-on-avoin-data/" target="_blank" rel="noopener noreferrer" title="Helsinki Region Infoshare: Mitä on avoin data?">open dataa</a>.
        Karttamateriaali &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a></p>
      </div>
    </div>
  }
}
