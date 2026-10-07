class Car extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            localLootTable: props.lootTable,
            Character : props.character,
            LocalEquippedItems : props.equippedItems,
            Enemy: props.enemy
        };
    }

    attack = () => {

    }

    defend = () => {

    }

    enemyDefeated = () => {

    }

    getDrop = () => {

    }

    populateCharacter = (character) => {
        this.setState({Character: character});
    }

    attackFromEnemy = () => {

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