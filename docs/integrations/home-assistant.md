# Home Assistant

`tools` liefert Fitness- und Finanzwerte als Sensoren an Home Assistant und nimmt Werte (Gewicht von der Smart-Waage, Wasser per Knopfdruck, Schritte vom Handy, Trainings) entgegen. Grundlage ist die [REST-API v1](../api/README.md); Entscheidung: [ADR-0011](../architecture/decisions/0011-rest-api-mit-bearer-tokens.md).

Die Snippets unten sind mit der Beispieladresse `http://tools.lan:3000` erzeugt. Die Seite **Integrationen & API** (`/integrationen`) zeigt dieselben Snippets bereits mit der richtigen Adresse zum Kopieren. Beide stammen aus `src/lib/integrationen/home-assistant-yaml.ts`; ein Test stellt sicher, dass YAML gültig ist, jeder Sensor auf ein Feld zeigt, das die API wirklich liefert, und diese Seite mit dem Code übereinstimmt.

> Getestet sind YAML-Syntax, Struktur und die Feldnamen gegen das API-Schema — nicht gegen eine laufende Home-Assistant-Instanz. Die Sensoren nutzen `availability`-Templates der REST-Integration; falls deine HA-Version sie nicht kennt, die `availability:`-Zeilen entfernen.

## Voraussetzungen

- Home Assistant erreicht `tools` über das Heimnetz/VPN (z. B. `http://<server-ip>:3000` oder die Reverse-Proxy-Adresse). Test vom HA-Host: `curl http://<adresse>/api/v1/status` → `"status": "ok"`.
- Ein **Fitness-Profil** in `tools` (`/fitness/profil`) — sonst sind Ziel- und Budget-Sensoren „nicht verfügbar“.
- Ein **API-Token** von `/integrationen`: „Nur lesen“ genügt für Sensoren; für `rest_command` (Werte zurückschreiben) „Darf schreiben“ aktivieren. Das Token gehört dem gerade aktiven Nutzer.

## 1. Token hinterlegen

```yaml
# secrets.yaml — Token aus /integrationen, mit "Bearer " davor
tools_api_auth: "Bearer tk_HIER_DEIN_TOKEN"
```

## 2. Sensoren

Ein Request alle 5 Minuten (`scan_interval: 300`) liefert alle Werte; HA verteilt sie per `value_template` auf einzelne Sensoren. Nach dem Einfügen Home Assistant neu starten (bzw. *Entwicklerwerkzeuge → YAML → REST-Entitäten neu laden*).

```yaml
# configuration.yaml — ein Request alle 5 Minuten liefert alle Werte
rest:
  - resource: http://tools.lan:3000/api/v1/home-assistant/sensoren
    headers:
      Authorization: !secret tools_api_auth
    scan_interval: 300
    timeout: 20
    sensor:
      - name: "Kalorien verbleibend"
        unique_id: tools_kalorien_verbleibend
        value_template: "{{ value_json.fitness.kalorien_verbleibend }}"
        availability: "{{ value_json is defined and value_json.fitness.kalorien_verbleibend is not none }}"
        unit_of_measurement: "kcal"
        state_class: measurement
        icon: mdi:food-apple
      - name: "Kalorien gegessen"
        unique_id: tools_kalorien_gegessen
        value_template: "{{ value_json.fitness.kalorien_gegessen }}"
        availability: "{{ value_json is defined and value_json.fitness.kalorien_gegessen is not none }}"
        unit_of_measurement: "kcal"
        state_class: measurement
        icon: mdi:silverware-fork-knife
      - name: "Kalorienbudget"
        unique_id: tools_kalorien_budget
        value_template: "{{ value_json.fitness.kalorien_budget }}"
        availability: "{{ value_json is defined and value_json.fitness.kalorien_budget is not none }}"
        unit_of_measurement: "kcal"
        state_class: measurement
        icon: mdi:target
      - name: "Kalorienbudget genutzt"
        unique_id: tools_kalorien_prozent
        value_template: "{{ value_json.fitness.kalorien_prozent }}"
        availability: "{{ value_json is defined and value_json.fitness.kalorien_prozent is not none }}"
        unit_of_measurement: "%"
        state_class: measurement
        icon: mdi:percent
      - name: "Trainingskalorien heute"
        unique_id: tools_kalorien_training
        value_template: "{{ value_json.fitness.kalorien_training }}"
        availability: "{{ value_json is defined and value_json.fitness.kalorien_training is not none }}"
        unit_of_measurement: "kcal"
        state_class: measurement
        icon: mdi:fire
      - name: "Protein heute"
        unique_id: tools_protein_g
        value_template: "{{ value_json.fitness.protein_g }}"
        availability: "{{ value_json is defined and value_json.fitness.protein_g is not none }}"
        unit_of_measurement: "g"
        state_class: measurement
        icon: mdi:food-steak
      - name: "Proteinziel"
        unique_id: tools_protein_ziel_g
        value_template: "{{ value_json.fitness.protein_ziel_g }}"
        availability: "{{ value_json is defined and value_json.fitness.protein_ziel_g is not none }}"
        unit_of_measurement: "g"
        icon: mdi:food-steak
      - name: "Wasser heute"
        unique_id: tools_wasser_ml
        value_template: "{{ value_json.fitness.wasser_ml }}"
        availability: "{{ value_json is defined and value_json.fitness.wasser_ml is not none }}"
        unit_of_measurement: "mL"
        state_class: measurement
        icon: mdi:cup-water
      - name: "Wasserziel"
        unique_id: tools_wasser_ziel_ml
        value_template: "{{ value_json.fitness.wasser_ziel_ml }}"
        availability: "{{ value_json is defined and value_json.fitness.wasser_ziel_ml is not none }}"
        unit_of_measurement: "mL"
        icon: mdi:cup-water
      - name: "Schritte heute"
        unique_id: tools_schritte
        value_template: "{{ value_json.fitness.schritte }}"
        availability: "{{ value_json is defined and value_json.fitness.schritte is not none }}"
        unit_of_measurement: "Schritte"
        state_class: measurement
        icon: mdi:walk
      - name: "Training heute"
        unique_id: tools_training_minuten_heute
        value_template: "{{ value_json.fitness.training_minuten_heute }}"
        availability: "{{ value_json is defined and value_json.fitness.training_minuten_heute is not none }}"
        unit_of_measurement: "min"
        state_class: measurement
        icon: mdi:run
      - name: "Training 7 Tage"
        unique_id: tools_training_minuten_7_tage
        value_template: "{{ value_json.fitness.training_minuten_7_tage }}"
        availability: "{{ value_json is defined and value_json.fitness.training_minuten_7_tage is not none }}"
        unit_of_measurement: "min"
        state_class: measurement
        icon: mdi:calendar-week
      - name: "Gewicht"
        unique_id: tools_gewicht_kg
        value_template: "{{ value_json.fitness.gewicht_kg }}"
        availability: "{{ value_json is defined and value_json.fitness.gewicht_kg is not none }}"
        unit_of_measurement: "kg"
        device_class: weight
        state_class: measurement
      - name: "Gewicht 7-Tage-Schnitt"
        unique_id: tools_gewicht_7_tage_kg
        value_template: "{{ value_json.fitness.gewicht_7_tage_kg }}"
        availability: "{{ value_json is defined and value_json.fitness.gewicht_7_tage_kg is not none }}"
        unit_of_measurement: "kg"
        device_class: weight
        state_class: measurement
      - name: "Gewichtstrend"
        unique_id: tools_gewicht_trend_kg_pro_woche
        value_template: "{{ value_json.fitness.gewicht_trend_kg_pro_woche }}"
        availability: "{{ value_json is defined and value_json.fitness.gewicht_trend_kg_pro_woche is not none }}"
        unit_of_measurement: "kg/Woche"
        state_class: measurement
        icon: mdi:trending-down
      - name: "Gewicht Zielprognose"
        unique_id: tools_gewicht_prognose_status
        value_template: "{{ value_json.fitness.gewicht_prognose_status }}"
        availability: "{{ value_json is defined and value_json.fitness.gewicht_prognose_status is not none }}"
        icon: mdi:flag-checkered
      - name: "BMI"
        unique_id: tools_bmi
        value_template: "{{ value_json.fitness.bmi }}"
        availability: "{{ value_json is defined and value_json.fitness.bmi is not none }}"
        state_class: measurement
        icon: mdi:human
      - name: "Nettovermögen"
        unique_id: tools_vermoegen_netto_eur
        value_template: "{{ value_json.finanzen.vermoegen_netto_eur }}"
        availability: "{{ value_json is defined and value_json.finanzen.vermoegen_netto_eur is not none }}"
        unit_of_measurement: "EUR"
        icon: mdi:cash-multiple
      - name: "Bargeld und Depots"
        unique_id: tools_bargeld_und_depots_eur
        value_template: "{{ value_json.finanzen.bargeld_und_depots_eur }}"
        availability: "{{ value_json is defined and value_json.finanzen.bargeld_und_depots_eur is not none }}"
        unit_of_measurement: "EUR"
        icon: mdi:piggy-bank
      - name: "Notgroschen"
        unique_id: tools_notgroschen_monate
        value_template: "{{ value_json.finanzen.notgroschen_monate }}"
        availability: "{{ value_json is defined and value_json.finanzen.notgroschen_monate is not none }}"
        unit_of_measurement: "Monate"
        state_class: measurement
        icon: mdi:shield-check
      - name: "Immobilien-Cashflow"
        unique_id: tools_immobilien_cashflow_monatlich_eur
        value_template: "{{ value_json.finanzen.immobilien_cashflow_monatlich_eur }}"
        availability: "{{ value_json is defined and value_json.finanzen.immobilien_cashflow_monatlich_eur is not none }}"
        unit_of_measurement: "EUR"
        icon: mdi:home-city
    binary_sensor:
      - name: "Kalorienbudget überschritten"
        unique_id: tools_ueber_budget
        value_template: "{{ value_json.fitness.ueber_budget }}"
        availability: "{{ value_json is defined and value_json.fitness.ueber_budget is not none }}"
        icon: mdi:alert-circle-outline
```

Entity-IDs entstehen aus den Namen, z. B. `sensor.kalorien_verbleibend`, `sensor.protein_heute`, `sensor.wasser_heute`, `sensor.gewicht_7_tage_schnitt`, `binary_sensor.kalorienbudget_uberschritten`. Weitere Werte (Fett/Kohlenhydrate, Schlaf, Ruhepuls, Ampel-Verteilung, Restschulden …) liefert derselbe Endpunkt — einfach nach dem gleichen Muster ergänzen; die vollständige Feldliste steht unter `components.schemas.HomeAssistantSensoren` in `/api/v1/openapi.json`.

| Gruppe | Felder (Auszug) | Bedeutung |
|---|---|---|
| Kalorien | `kalorien_ziel`, `kalorien_budget`, `kalorien_gegessen`, `kalorien_training`, `kalorien_verbleibend`, `kalorien_prozent`, `ueber_budget` | Budget = Tagesziel + angerechnete Trainingskalorien |
| Makros | `protein_g`/`protein_ziel_g`, `kohlenhydrate_g`/`…_ziel_g`, `fett_g`/`…_ziel_g` | gegessen vs. Ziel |
| Tageswerte | `wasser_ml`, `wasser_ziel_ml`, `schritte`, `schritte_ziel`, `schlaf_stunden`, `ruhepuls` | heute |
| Woche | `training_minuten_7_tage`, `training_einheiten_7_tage`, `kalorien_schnitt_7_tage`, `tage_im_zielkorridor_7_tage` | letzte 7 Tage inkl. heute |
| Gewicht | `gewicht_kg`, `gewicht_7_tage_kg`, `gewicht_trend_kg_pro_woche`, `gewicht_ziel_kg`, `gewicht_prognose_status`, `gewicht_prognose_datum`, `bmi` | Trend = Regression über 28 Tage |
| Finanzen | `vermoegen_netto_eur`, `vermoegen_referenz_eur`, `bargeld_und_depots_eur`, `restschulden_eur`, `notgroschen_monate`, `immobilien_cashflow_monatlich_eur`, `objekte_ampel_*` | wie die Startseite |

`gewicht_prognose_status`: `IN_RICHTUNG`, `FALSCHE_RICHTUNG`, `STAGNATION`, `ERREICHT`, `ZU_WENIG_DATEN`, `KEIN_ZIEL`.

## 3. Werte zurückschreiben (`rest_command`)

Braucht ein Token mit Schreibzugriff. Alle Befehle schreiben für **heute**; `datum` lässt sich bei Bedarf im Payload ergänzen.

```yaml
# configuration.yaml — Werte aus Home Assistant zurückschreiben (Token mit Schreibzugriff nötig)
rest_command:
  tools_wasser:
    url: http://tools.lan:3000/api/v1/fitness/tageswerte/wasser
    method: POST
    headers:
      Authorization: !secret tools_api_auth
    content_type: "application/json"
    payload: '{"ml": {{ ml | default(250) | int }}}'
  tools_gewicht:
    url: http://tools.lan:3000/api/v1/fitness/gewicht
    method: POST
    headers:
      Authorization: !secret tools_api_auth
    content_type: "application/json"
    payload: '{"gewichtKg": {{ gewicht | float }}}'
  tools_schritte:
    url: http://tools.lan:3000/api/v1/fitness/tageswerte
    method: PUT
    headers:
      Authorization: !secret tools_api_auth
    content_type: "application/json"
    payload: '{"schritte": {{ schritte | int }}}'
  tools_training:
    url: http://tools.lan:3000/api/v1/fitness/training
    method: POST
    headers:
      Authorization: !secret tools_api_auth
    content_type: "application/json"
    payload: '{"sportart": "{{ sportart | default("SONSTIGES") }}", "dauerMin": {{ minuten | int }}, "notiz": "Home Assistant"}'
```

## Automationen

Syntax ab Home Assistant 2024.10 (`triggers:`/`actions:`); ältere Versionen nutzen `trigger:`/`platform:`/`service:`. Entity-IDs deiner Geräte anpassen.

### Smart-Waage → tools

```yaml
automation:
  - alias: "tools: Gewicht von der Waage übernehmen"
    triggers:
      - trigger: state
        entity_id: sensor.waage_gewicht
    conditions:
      - condition: template
        value_template: "{{ trigger.to_state.state | float(0) > 20 }}"
    actions:
      - action: rest_command.tools_gewicht
        data:
          gewicht: "{{ trigger.to_state.state }}"
```

Mehrere Wiegungen am selben Tag sind unproblematisch — `tools` speichert einen Wert pro Tag (der letzte gewinnt) und rechnet Trends ohnehin über den 7-Tage-Schnitt.

### Schritte vom Handy

```yaml
  - alias: "tools: Schritte übertragen"
    triggers:
      - trigger: time_pattern
        minutes: "/30"
    conditions:
      - condition: template
        value_template: "{{ states('sensor.handy_schritte_heute') | is_number }}"
    actions:
      - action: rest_command.tools_schritte
        data:
          schritte: "{{ states('sensor.handy_schritte_heute') | int }}"
```

Der Sensor muss Schritte **seit Mitternacht** liefern. Zählt dein Handy-Sensor seit dem letzten Neustart (je nach Companion-App/Plattform), einen `utility_meter` mit `cycle: daily` dazwischenschalten und dessen Wert senden. `PUT /fitness/tageswerte` überschreibt nur `schritte` — Wasser und Schlaf bleiben erhalten.

### Wasser per Knopf

Helfer `input_button.glas_wasser` anlegen (oder einen Zigbee-Taster als Trigger nehmen):

```yaml
  - alias: "tools: Glas Wasser"
    triggers:
      - trigger: state
        entity_id: input_button.glas_wasser
    actions:
      - action: rest_command.tools_wasser
        data:
          ml: 250
      - action: homeassistant.update_entity
        target:
          entity_id: sensor.wasser_heute
```

`update_entity` lädt die Sensoren sofort neu, statt bis zum nächsten 5-Minuten-Intervall zu warten.

### Erinnerung am Abend

```yaml
  - alias: "tools: Protein-Erinnerung"
    triggers:
      - trigger: time
        at: "19:30:00"
    conditions:
      - condition: template
        value_template: >
          {{ states('sensor.proteinziel') | is_number and
             states('sensor.protein_heute') | float(0) < states('sensor.proteinziel') | float(0) * 0.7 }}
    actions:
      - action: notify.notify
        data:
          title: "Protein"
          message: >
            Erst {{ states('sensor.protein_heute') | float(0) | round(0) }} von
            {{ states('sensor.proteinziel') }} g heute.

  - alias: "tools: Kalorienbudget überschritten"
    triggers:
      - trigger: state
        entity_id: binary_sensor.kalorienbudget_uberschritten
        to: "on"
    actions:
      - action: notify.notify
        data:
          message: "Tagesbudget überschritten ({{ states('sensor.kalorienbudget_genutzt') }} %)."
```

## Dashboard-Karten

```yaml
type: vertical-stack
cards:
  - type: gauge
    name: Kalorienbudget
    entity: sensor.kalorienbudget_genutzt
    min: 0
    max: 120
    severity:
      green: 0
      yellow: 90
      red: 105
  - type: entities
    title: Heute
    entities:
      - sensor.kalorien_verbleibend
      - sensor.protein_heute
      - sensor.wasser_heute
      - sensor.schritte_heute
      - sensor.training_heute
  - type: history-graph
    title: Gewicht
    hours_to_show: 720
    entities:
      - sensor.gewicht
      - sensor.gewicht_7_tage_schnitt
```

Ein Knopf für Wasser auf dem Dashboard: `type: button` mit `entity: input_button.glas_wasser`.

## Fehlersuche

| Symptom | Ursache / Lösung |
|---|---|
| Alle Sensoren „nicht verfügbar“, Log zeigt 401 | `secrets.yaml` muss `Bearer ` vor dem Token enthalten; Token widerrufen? Mit `curl -H "Authorization: Bearer tk_…" <adresse>/api/v1/ich` prüfen. |
| Nur Ziel-/Budget-Sensoren „nicht verfügbar“ | Kein Fitness-Profil oder noch kein Gewicht eingetragen — `/fitness/profil` ausfüllen. |
| `rest_command` liefert 403 | Token ist „Nur lesen“ — ein Token mit Schreibzugriff anlegen. |
| `rest_command` liefert 422 | Payload ungültig (z. B. Gewicht außerhalb 20–400 kg); die Antwort nennt das Feld. |
| Werte hinken hinterher | `scan_interval` verkleinern (nicht unter 60 s nötig) oder nach Schreibaktionen `homeassistant.update_entity` aufrufen. |
| Falscher Nutzer | Tokens gehören dem Nutzer, der beim Erstellen aktiv war (`/api/v1/ich` zeigt ihn). |
