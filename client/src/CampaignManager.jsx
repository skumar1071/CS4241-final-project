import { useState } from 'react'

export default function CampaignManager({}) {
    const [encounters, setEncounters] = useState([])
    const [items, setItems] = useState([])

    // example is unused for now and may be changed
    const encounter = {
        playerCharacters: ["id1", "id2"],
        enemies: ["id1", "id2"],
        enemiesHp: [3,4],

        // returns a list of generated player dmg numbers
        runDmgCalcPlayer: function(){

        },
        // returns a list of generated enemies dmg numbers
        runDmgCalcEnemies: function(){

        }
    }

    return (
        <p>Placeholder</p>
    )
}