import React from 'react';

export default class Character extends React.Component {
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
        return new Promise((resolve) => {
            this.setState((state) => {
                if (!state.Character || state.Character.currHp <= 0 || state.enemyHp <= 0) {
                    return { isDefending: false };
                }
                const equipped = state.LocalEquippedItems;
                const items = Array.isArray(equipped) ? equipped : equipped ? [equipped] : [];
                const bonus = items.reduce((total, item) => {
                    return item?.modifierType === 'dmg_given' && Number.isFinite(item.modifier)
                        ? total + Math.max(0, item.modifier) : total;
                }, 0);
                const damage = Math.floor(Math.random() * 6) + 1 + bonus;
                return { enemyHp: Math.max(0, state.enemyHp - damage), isDefending: false };
            }, resolve);
        });
    }

    defend = () => {
        return new Promise((resolve) => {
            this.setState((state) => ({
                isDefending: Boolean(state.Character && state.Character.currHp > 0 && state.enemyHp > 0)
            }), resolve);
        });
    }

    enemyDefeated = () => {
        return this.state.enemyHp <= 0;
    }

    attackFromEnemy = () => {
        return new Promise((resolve) => {
            this.setState((state) => {
                if (!state.Character || state.Character.currHp <= 0 || state.enemyHp <= 0) {
                    return { isDefending: false };
                }
                const equipped = state.LocalEquippedItems;
                const items = Array.isArray(equipped) ? equipped : equipped ? [equipped] : [];
                const reduction = items.reduce((total, item) => {
                    return item?.modifierType === 'dmg_reduction' && Number.isFinite(item.modifier)
                        ? total + Math.max(0, item.modifier) : total;
                }, 0);
                const { minDamage, maxDamage } = state.Enemy;
                const roll = Math.floor(Math.random() * (maxDamage - minDamage + 1)) + minDamage;
                const damage = Math.max(0, roll - reduction);
                const receivedDamage = state.isDefending ? Math.ceil(damage / 2) : damage;
                return {
                    Character: { ...state.Character, currHp: Math.max(0, state.Character.currHp - receivedDamage) },
                    isDefending: false
                };
            }, resolve);
        });
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
