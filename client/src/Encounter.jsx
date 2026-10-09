import React from 'react';

export default class Character extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            updateCharacterHp: props.updateCharacterHp,
            // this is a list of items
            localLootTable: props.lootTable,
            Character : null,
            LocalEquippedItem : null,
            Enemy: props.enemy,
            enemyHp: Math.floor((props.enemy.maxHp - props.enemy.minHp) * Math.random() + 1) + props.enemy.minHp,
            addItem: props.addItem,
            isDefending: false,
            // keep check on this to make sure that the encounter stops when they are dead
            isDead: false,
        };
    }

    attack = () => {
        return new Promise((resolve) => {
            this.setState((state) => {
                if (!state.Character || state.Character.currHp <= 0 || state.enemyHp <= 0) {
                    return { isDefending: false };
                }
                const equipped = state.LocalEquippedItem;
                //const items = Array.isArray(equipped) ? equipped : equipped ? [equipped] : [];
                const hpBonus = equipped => {
                    return equipped?.modifierType === 'healing' && Number.isFinite(equipped.modifier)
                        ? Math.max(0, equipped.modifier) : 0;
                };
                if (!state.Character.currHp <= 0 && !state.enemyHp <= 0) {
                    return { Character: {...Character, hp: Number(Character.hp)+hpBonus } };
                }
                const bonus = equipped => {
                    return equipped?.modifierType === 'dmg_given' && Number.isFinite(equipped.modifier)
                        ? Math.max(0, equipped.modifier) : 0;
                };
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

    equip = (itemId) => {
        const hpBonus = (item) => {
            return item?.modifierType === 'max_hp' && Number.isFinite(item.modifier)
                ? Math.max(0, item.modifier) : 0;
        };
    }

    attackFromEnemy = () => {
        return new Promise((resolve) => {
            this.setState((state) => {
                if (!state.Character || state.Character.currHp <= 0 || state.enemyHp <= 0) {
                    return { isDefending: false };
                }
                const equipped = state.LocalEquippedItem;
                const reduction = equipped => {
                    return equipped?.modifierType === 'dmg_reduction' && Number.isFinite(equipped.modifier)
                        ? Math.max(0, equipped.modifier) : 0;
                };
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
        const dropped = Math.random() >= 0.3;
        if (dropped){
            const randomItem = this.state.localLootTable[Math.floor(Math.random()*this.state.localLootTable.length)];
            this.state.addItem(randomItem, this.state.Character.id);
        }
    }

    equipItem = () => {
        const reduction = equipped => {
            return equipped?.modifierType === 'dmg_reduction' && Number.isFinite(equipped.modifier)
                ? Math.max(0, equipped.modifier) : 0;
        };
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
