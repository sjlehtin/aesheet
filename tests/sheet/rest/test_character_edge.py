from django.test import TestCase
from rest_framework.test import APIClient, APIRequestFactory

from sheet import factories as factories, models as models


class CharacterEdgeTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.request_factory = APIRequestFactory()
        self.owner = factories.UserFactory(username="luke")
        self.sheet = factories.SheetFactory()
        self.assertTrue(
            self.client.login(username="luke", password="foobar"))
        self.url = '/rest/characters/{}/characteredges/'.format(
            self.sheet.character.pk)

    def test_url(self):
        response = self.client.get(self.url, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [])

    def test_shows_items(self):
        factories.CharacterEdgeFactory(character=self.sheet.character,
                                       edge__edge__name="Hardened Skin",
                                       edge__armor_l=-1.0,
                                       edge__armor_dr=-2.0)

        response = self.client.get(self.url, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

        edge_level = response.data[0]["edge"]
        self.assertIsInstance(edge_level, dict)
        assert edge_level["edge"]["name"] == "Hardened Skin"
        assert edge_level["armor_l"] == "-1.0"
        assert edge_level["armor_dr"] == "-2.0"

    def test_adding_items(self):
        edge = factories.EdgeLevelFactory(edge__name="Natural climber", level=1)

        response = self.client.post(
                self.url,
                data={'edge': edge.pk}, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(models.Character.objects.get(
            id=self.sheet.character.id).edges.all()[0].edge.name,
                         "Natural climber")

        entries = models.CharacterLogEntry.objects.all()
        assert len(entries) == 1
        assert "Added edge Natural climber 1" in str(entries[0])

    def test_patch(self):
        character_edge = factories.CharacterEdgeFactory(
            character=self.sheet.character,
            edge__edge__name="Short winded",
            edge__level=1)
        item_id = character_edge.id
        assert not character_edge.ignore_cost

        response = self.client.patch(
                "{}{}/".format(self.url, item_id),
                data={'ignore_cost': True}, format='json')
        self.assertEqual(response.status_code, 200)

        character_edge = models.CharacterEdge.objects.get(
            id=item_id)
        assert character_edge.ignore_cost

    def test_patch_should_not_change_edge(self):
        character_edge = factories.CharacterEdgeFactory(
            character=self.sheet.character,
            edge__edge__name="Short winded")
        ce_id = character_edge.id
        edge_id = character_edge.edge.id

        edge_level = factories.EdgeLevelFactory(edge__name="Test edge")

        response = self.client.patch(
                "{}{}/".format(self.url, ce_id),
                data={'edge': {'id': edge_level.id}},
                format='json')
        self.assertEqual(response.status_code, 200)

        character_edge = models.CharacterEdge.objects.get(
            id=ce_id)
        assert character_edge.edge.id == edge_id


    def test_deleting_items(self):
        char_edge = factories.CharacterEdgeFactory(
            character=self.sheet.character,
            edge__edge__name="Natural climber",
            edge__level=1)

        response = self.client.delete(
                "{}{}/".format(self.url, char_edge.pk), format='json')
        self.assertEqual(response.status_code, 204)
        self.assertEqual(models.CharacterEdge.objects.count(), 0,
                         "The row should get deleted")

        entries = models.CharacterLogEntry.objects.all()
        assert len(entries) == 1
        assert "Removed edge Natural climber 1" in str(entries[0])
