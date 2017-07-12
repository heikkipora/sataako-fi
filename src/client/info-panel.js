import {isKohtaSataa} from './pete'
import React from 'react'

class InfoPanel extends React.Component {
  constructor() {
    super()
    this.state = {
      collapsed: localStorage.getItem('sataako-fi-collapsed') === 'true'
    }
  }

  render() {
    if (this.state.collapsed) {
      return <div id="side-info-panel-open" onClick={this.expand.bind(this)}>&lt;</div>
    }

    return <div className="side-info-panel">
      <button id="close-side-info" onClick={this.collapse.bind(this)}>Sulje</button>
      {isKohtaSataa() ? this.renderPeteContent() : this.renderContent()}
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

  renderPeteContent() {
    return <div>
      <div className="logo-container">
        <img src="/img/sataako-logo-white.png" alt="Kohta sataa logo - kohtasataa.fi" title="Kohta sataa logo - kohtasataa.fi" />
      </div>
      <div className="description-container">
        <h1>Kohta<br/>sataa!</h1>
        <p>Live-sadetilanne kätevästi Suomessa ja lähialueilla. Milloin lähteä lenkille, uimarannalle, piknikille tai kalaan? Katso, missä lähin sadepilvi luuraa! Unohda hankalat täsmäsääpalvelut ja tuntiennusteet.</p>
        <p>Nyt kesän kunniaksi PETE PARKKOSEN tulevat keikat kartalla! Tutustu <a href="https://www.sataako.fi">SATAAKO.FI</a> -palveluun jos olet kiinnostunut vain säästä :-)</p>
        <iframe width="280" height="130" src="https://www.youtube.com/embed/L9ZbJrxloQ8" frameBorder="0" allowFullScreen></iframe>
        <p>Tämän palvelun on tehnyt vapaa-ajallaan <a href="https://twitter.com/p0ra" target="_blank" rel="noopener noreferrer" title="Heikki Pora Twitter">Heikki&nbsp;Pora</a>, jonka sade pääsi yllättämään.</p>
        <p>Kartalla esitetään <a href="https://ilmatieteenlaitos.fi/avoin-data/" target="_blank" rel="noopener noreferrer" title="Ilmatieteenlaitos Avoin Data">Ilmatieteen laitoksen</a> toimittamia tietoaineistoja. Tiedot ovat kaikille avointa tietoa eli <a href="http://www.hri.fi/fi/mita-on-avoin-data/" target="_blank" rel="noopener noreferrer" title="Helsinki Region Infoshare: Mitä on avoin data?">open dataa</a>. Peten keikat haetaan <a href="http://warnermusiclive.fi/artistit/pete-parkkonen/" target="_blank" rel="noopener noreferrer">Warner Music Finlandilta</a> kerran vuorokaudessa. Warner Music Finland Oy ei ole millään tavalla vastuussa tästä palvelusta.</p>
      </div>
    </div>
  }

  collapse() {
    this.setState({collapsed: true})
    localStorage.setItem('sataako-fi-collapsed', 'true')
  }

  expand() {
    this.setState({collapsed: false})
    localStorage.setItem('sataako-fi-collapsed', 'false')
  }
}

module.exports = InfoPanel
