class Car extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            localLootTable: props.lootTable,
            Character : props.character,
            LocalEquippedItems : props.equippedItems,
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

    }

    getDrop = () => {

    }

    populateCharacter = (character) => {
        this.setState({Character: character});
    }

    turnAction = (action) => {

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