from typing import Literal
from pydantic import BaseModel, Field, model_validator

Ancestry = Literal["humano", "elfo", "anao", "meio_orc"]
CharacterClass = Literal["guerreiro", "mago", "patrulheiro", "ladino"]
Background = Literal["soldado", "erudito", "forasteiro", "artesao", "criminoso"]
COSTS = {8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9}
ATTRIBUTE_NAMES = ("for", "des", "con", "int", "sab", "car")


class Attributes(BaseModel):
    for_: int = Field(alias="for", ge=8, le=15)
    des: int = Field(ge=8, le=15)
    con: int = Field(ge=8, le=15)
    int_: int = Field(alias="int", ge=8, le=15)
    sab: int = Field(ge=8, le=15)
    car: int = Field(ge=8, le=15)

    @model_validator(mode="after")
    def validate_point_buy(self):
        values = self.model_dump(by_alias=True)
        if sum(COSTS[value] for value in values.values()) != 27:
            raise ValueError("A ficha deve gastar exatamente 27 pontos.")
        return self


class CharacterCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    ancestry: Ancestry
    class_name: CharacterClass
    background: Background
    personal_history: str = Field(default="", max_length=3000)
    attributes: Attributes


def attribute_modifier(score: int) -> int:
    return (score - 10) // 2
