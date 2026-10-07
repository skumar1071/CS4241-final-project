class Car extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            updateCharacterHp: props.updateCharacterHp,
            localLootTable: props.lootTable,
            Character : null,
            LocalEquippedItems : null,
            Enemy: props.enemy,
            enemyHp: Math.floor((props.enemy.maxHp - props.enemy.minHp) * Math.random() + 1) + props.enemy.minHp
        };
    }

    attack = () => {

    }

    defend = () => {

    }

    enemyDefeated = () => {
        return (enemyHp === 0);
    }

    attackFromEnemy = () => {
        if (Character !== null) {
            const dmg = (Math.floor((props.enemy.maxDamage - props.enemy.minDamage) * Math.random() + 1) + props.enemy.minDamage) // TODO: add weapon modifier
            this.setState({
                Character: {
                    ...this.state.Character,
                    currHp: (this.state.Character.currHp - dmg >= 0)? this.state.Character.currHp - dmg : 0
                }
            });
        }
    }

    getDrop = () => {

    }

    populateCharacter = (character) => {
        this.setState({Character: character});
    }

    turnAction = (action) => {

    }

    returnRenderables = () => {

    }

    render() {
        // boilerplate from jsx example
        return (
            <div>
                <h1>My {this.state.brand}</h1>
                <p>
                    It is a {this.state.color}
                    {this.state.model}
                    from {this.state.year}.
                </p>
                <button
                    type="button"
                    onClick={this.changeColor}
                >Change color</button>
            </div>
        );
    }
}