import pytest
from pydantic import ValidationError
from app.character_rules import Attributes, CharacterCreate, attribute_modifier


def test_valid_point_buy():
    values = {"for": 15, "des": 14, "con": 13, "int": 12, "sab": 10, "car": 8}
    # 9+7+5+4+2+0 = 27
    assert Attributes.model_validate(values).model_dump(by_alias=True) == values


def test_invalid_budget():
    with pytest.raises(ValidationError):
        Attributes.model_validate({"for": 15, "des": 15, "con": 15, "int": 8, "sab": 8, "car": 8})


def test_character_payload():
    character = CharacterCreate(name="Tharion", ancestry="humano", class_name="guerreiro", background="soldado", attributes={"for": 15, "des": 14, "con": 13, "int": 12, "sab": 10, "car": 8})
    assert character.name == "Tharion"


def test_modifiers():
    assert attribute_modifier(8) == -1
    assert attribute_modifier(15) == 2
