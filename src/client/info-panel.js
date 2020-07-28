import PropTypes from 'prop-types'
import React from 'react'

export class InfoPanel extends React.PureComponent {
  render() {
    if (this.props.collapsed) {
      return <div id="side-info-panel-open" onClick={this.props.onInfoPanelToggle}>&lt;</div>
    }

    return <div className="side-info-panel">
      <button id="close-side-info" onClick={this.props.onInfoPanelToggle}>Sulje</button>
      {this.renderContent()}
    </div>
  }

  renderContent() {
    return <div>
      <div className="logo-container">
        <img src="/img/sataako-logo-white.png" alt="Sataako kohta logo - sataako.fi" title="Sataako kohta logo - sataako.fi" />
      </div>
      <div className="description-container">
        <h1>Sataako<br/>kohta?</h1>
        <p>Live-sadetilanne kätevästi Suomessa ja lähialueilla. Milloin lähteä lenkille, uimarannalle, piknikille tai kalaan? Katso, missä lähin sadepilvi luuraa! Unohda hankalat täsmäsääpalvelut ja tuntiennusteet.</p>
        <p>Tutkakuva päivittyy automaattisesti ja jatkuvasti, viiden minuutin välein. Mitä lähempänä väri on punaista, sitä enemmän sataa.</p>
        <p>Tämän palvelun on tehnyt vapaa-ajallaan <a href="https://twitter.com/p0ra" target="_blank" rel="noopener noreferrer" title="Heikki Pora Twitter">Heikki&nbsp;Pora</a>, jonka sade pääsi yllättämään.</p>
        <p>Kartalla esitetään <a href="https://ilmatieteenlaitos.fi/avoin-data/" target="_blank" rel="noopener noreferrer" title="Ilmatieteenlaitos Avoin Data">Ilmatieteen laitoksen</a> toimittamia tietoaineistoja. Tiedot ovat kaikille avointa tietoa eli <a href="http://www.hri.fi/fi/mita-on-avoin-data/" target="_blank" rel="noopener noreferrer" title="Helsinki Region Infoshare: Mitä on avoin data?">open dataa</a>.</p>
      </div>
    </div>
  }
}

InfoPanel.propTypes = {
  collapsed: PropTypes.bool.isRequired,
  onInfoPanelToggle: PropTypes.func.isRequired
}
